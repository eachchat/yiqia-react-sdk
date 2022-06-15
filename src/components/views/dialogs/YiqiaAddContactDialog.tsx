import React, { useEffect, useState } from "react";
import { KeyBindingAction } from "../../../accessibility/KeyboardShortcuts";
import IdentityAuthClient from "../../../IdentityAuthClient";
import { getKeyBindingsManager } from "../../../KeyBindingsManager";
import { _t } from "../../../languageHandler";
import { MatrixClientPeg } from "../../../MatrixClientPeg";
import { UserModal } from "../../../models/YiqiaModels";
import SettingsStore from "../../../settings/SettingsStore";
import { UIFeature } from "../../../settings/UIFeature";
import { makeUserPermalink } from "../../../utils/permalinks/Permalinks";
import { YiqiaContact } from "../../../utils/yiqiaUtils/YiqiaContact";
import YiqiaBaseSearch from "../../structures/YiqiaBaseSearch";
import AccessibleTooltipButton from "../elements/AccessibleTooltipButton";
import * as PhoneNumber from '../../../phonenumber';
import * as Email from "../../../email";
import YiqiaUserItem, { DescriptType } from "../yiqia/YiqiaUserItem";
import BaseDialog from "./BaseDialog";
import { YiqiaContactContactStore } from "../../../stores/YiqiaContactContactStore";
import AutoHideScrollbar from "../../structures/AutoHideScrollbar";
import { arrayFastClone } from "../../../utils/arrays";

interface ItemProps {
    user: UserModal;
}

enum AddState {
    CanAdd,
    Adding,
    Added,
    Failed,
}
const YiqiaCreateContactItem: React.FC<ItemProps> = (props) => {
    const [curState, setCurState] = useState<AddState>(YiqiaContactContactStore.Instance.isUserInContact(props.user) ? AddState.Added : AddState.CanAdd);
    let buttonText = _t("Add");

    const addContact = async() => {
        try{
            const userInfo = await YiqiaContact.Instance.yiqiaGmsInfoFromMatrixId(props.user.matrixId);
            if(userInfo) {
                console.log("lllll ", userInfo);
                YiqiaContact.Instance.yiqiaContactAdd(userInfo).then(res => {
                    console.log("res======= ", res);
                    YiqiaContactContactStore.Instance.generalContactsList().then(res => {
                        setCurState(AddState.Added);
                        buttonText = _t("Added");
                    })
                })
            } else {
                YiqiaContact.Instance.yiqiaContactAdd(props.user).then(res => {
                    console.log("res======= ", res);
                    YiqiaContactContactStore.Instance.generalContactsList().then(res => {
                        setCurState(AddState.Added);
                        buttonText = _t("Added");
                    })
                })
            }
        }
        catch(error) {
            console.log("YiqiaCreateContactItem error ", error);
        }
    }

    let className;
    if(!YiqiaContactContactStore.Instance.isUserInContact(props.user)) {
        className = "yiqia_AddContact_canAdd"
    } else if(YiqiaContactContactStore.Instance.isUserInContact(props.user)) {
        className = "yiqia_AddContact_added"
        buttonText = _t("Added");
    }

    useEffect(() => {
        if(!YiqiaContactContactStore.Instance.isUserInContact(props.user)) {
            className = "yiqia_AddContact_canAdd"
        } else if(YiqiaContactContactStore.Instance.isUserInContact(props.user)) {
            className = "yiqia_AddContact_added"
            buttonText = _t("Added");
        }
    }, []);

    return (
        <div className="YiqiaAddContact">
            <YiqiaUserItem userItem={props.user} descriptType={DescriptType.MatrixId}></YiqiaUserItem>
            <AccessibleTooltipButton
                kind="primary_outline"
                className={`yiqia_AddContact_addButton ${className}`}
                title={_t("Add")}
                onClick={ addContact }
            >
                <div className="yiqia_AddContact_addLabel">{ buttonText }</div>
            </AccessibleTooltipButton>
        </div>
    )
}

interface IYiqiaAddContactDialogProps {
    onFinished: (success: boolean) => void;
    initialText: string;
    users: UserModal[];
}

interface IYiqiaAddContactDialogState {
    filterText: string;
    busy: boolean;
    users: UserModal[];
    canUseIdentityServer: boolean;
    tryingIdentityServer: boolean;
}

class YiqiaAddContactDialog extends React.PureComponent<IYiqiaAddContactDialogProps, IYiqiaAddContactDialogState> {
    private debounceTimer: number = null;

    constructor(props) {
        super(props);
        this.state = {
            filterText: this.props.initialText,
            busy: false,
            users: [],
            canUseIdentityServer: !!MatrixClientPeg.get().getIdentityServerUrl(),
            tryingIdentityServer: false,
        };
    }

    private generalUserList(): UserModal[] {
        
        return;
    }

    private convertFilter(): UserModal[] {
        return;
    }

    private createContact = async () => {
        this.setState({ busy: true });
    }

    private onKeyDown = (e) => {
        if(this.state.busy) return;

        let handled = false;
        const value = e.target.value.trim();
        const action = getKeyBindingsManager().getAccessibilityAction(e);

        switch(action) {
            case KeyBindingAction.Enter:
                this.convertFilter();
                handled = true;
                break;
        }

        if(handled) {
            e.preventDefault();
        }
    }

    private onCancel = () => {
        this.props.onFinished(false);
    }

    private updateFilter = (term) => {
        this.setState({
            filterText: term,
        })

        if(this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.onSearch(term);
        }, 150);
    }

    private showUsersList = () => {
        // this.setState({
        //     users: 
        // })
    }

    private onSelectUser():boolean {
        return true;
    }

    private async updateSearchResults(term) {
        if(term !== this.state.filterText || term.trim().length === 0) {
            return;
        }
        const matrixClient = MatrixClientPeg.get();
        const dealedResult: UserModal[] = [];
        const oriResult = arrayFastClone(this.state.users);
        for(const user of oriResult) {
            if(user.matrixId) {
                const profile = await matrixClient.getUser(user.matrixId);
                user.photoUrl = profile?.avatarUrl;
                dealedResult.push(user);
            }
            if(term !== this.state.filterText || term.trim().length === 0) break;
        }
        this.setState({ users: dealedResult });
    }

    private async onSearch(term) {
        console.log("the term is ", term);
        YiqiaContact.Instance.yiqiaGmsSearch(term).then(async(gmsResult) => {
            if(term !== this.state.filterText || term.trim().length === 0) {
                return;
            }

            console.log("gmsResult is ", gmsResult);
            if(gmsResult.length !== 0) {
                let dealedResult:UserModal[] = [];
                for(let i = 0; i < gmsResult.length; i++) {
                    if(term !== this.state.filterText || term.trim().length === 0) break;
                    const u = gmsResult[i];
                    let profile;
                    dealedResult.push(new UserModal(u.matrixId, u.displayName, profile?.avatar_url));
                }

                console.log("add dealedResult ", dealedResult);
                this.setState({ users: dealedResult });
            }
            this.updateSearchResults(term);
        });

        MatrixClientPeg.get().searchUserDirectory({ term }).then(async r => {
            if (term !== this.state.filterText) {
                // Discard the results - we were probably too slow on the server-side to make
                // these results useful. This is a race we want to avoid because we could overwrite
                // more accurate results.
                return;
            }

            if (!r.results) r.results = [];

            // While we're here, try and autocomplete a search result for the mxid itself
            // if there's no matches (and the input looks like a mxid).
            if (term[0] === '@' && term.indexOf(':') > 1) {
                try {
                    const profile = await MatrixClientPeg.get().getProfileInfo(term);
                    if (profile) {
                        // If we have a profile, we have enough information to assume that
                        // the mxid can be invited - add it to the list. We stick it at the
                        // top so it is most obviously presented to the user.
                        r.results.splice(0, 0, {
                            user_id: term,
                            display_name: profile['displayname'],
                            avatar_url: profile['avatar_url'],
                        });
                    }
                } catch (e) {
                    // Add a result anyways, just without a profile. We stick it at the
                    // top so it is most obviously presented to the user.
                    // r.results.splice(0, 0, {
                    //     user_id: term,
                    //     display_name: term,
                    //     avatar_url: null,
                    // });
                }
            }

            this.setState({
                users: r.results.map(u => {
                    return new UserModal(u.user_id, u.display_name, u.avatar_url);
                }),
            });
        }).catch(e => {
            this.setState({ users: [] }); // clear results because it's moderately fatal
        });

        // Whenever we search the directory, also try to search the identity server. It's
        // all debounced the same anyways.
        if (!this.state.canUseIdentityServer) {
            // The user doesn't have an identity server set - warn them of that.
            this.setState({ tryingIdentityServer: true });
            return;
        }
        if (SettingsStore.getValue(UIFeature.IdentityServer)) {
            try {
                const authClient = new IdentityAuthClient();
                const token = await authClient.getAccessToken();
                if (term !== this.state.filterText) return; // abandon hope
                let lookup;
                if(term.indexOf('@') > 0 && Email.looksValid(term.trim())) {
                    lookup = await MatrixClientPeg.get().lookupThreePid(
                        'email',
                        term.trim(),
                        undefined, // callback
                        token,
                    );
                }
                else if(PhoneNumber.looksValid(term.trim())) {
                    const phoneNumber = PhoneNumber.packagePhoneNumberWithDefaultCountry(term);
                    lookup = await MatrixClientPeg.get().lookupThreePid(
                        'msisdn',
                        phoneNumber.trim(),
                        undefined, // callback
                        token,
                    );

                    if(!lookup || !lookup.mxid) {
                        lookup = await MatrixClientPeg.get().lookupThreePid(
                            'msisdn',
                            term.trim(),
                            undefined, // callback
                            token,
                        );
                    }
                }
                if (term !== this.state.filterText) return; // abandon hope

                if (!lookup || !lookup.mxid) {
                    // We weren't able to find anyone - we're already suggesting the plain email
                    // as an alternative, so do nothing.
                    return;
                }

                // We append the user suggestion to give the user an option to click
                // the email anyways, and so we don't cause things to jump around. In
                // theory, the user would see the user pop up and think "ah yes, that
                // person!"
                const profile = await MatrixClientPeg.get().getProfileInfo(lookup.mxid);
                if (term !== this.state.filterText || !profile) return; // abandon hope
                
                this.setState({
                    users: [new UserModal(lookup.mxid, profile.displayname, profile.avatar_url)],
                });
            } catch (e) {
                this.setState({ users: [] }); // clear results because it's moderately fatal
            }
        }
    }
    
    render() {
            let helpText;
            
            const cli = MatrixClientPeg.get();
            const userId = cli.getUserId();
            helpText = _t(
                "Add a contact with someone using their name, email address, phone number or username (like <userId/>).",
                {},
                { userId: () => {
                    return (
                        <a href={makeUserPermalink(userId)} rel="noreferrer noopener" target="_blank">{ userId }</a>
                    );
                } },
            );
        return (
            <BaseDialog
                className="yiqia_AddContact_dialog"
                onFinished={this.props.onFinished}
                title={_t("Add Contact")}
            >
                <div className='yiqia_AddContact_content'>
                    <YiqiaBaseSearch
                        onChange={this.updateFilter.bind(this)}
                    />
                    <AutoHideScrollbar className="yiqia_ContactAdd_scroll">
                        {
                            this.state.users.map(user => {
                                return <YiqiaCreateContactItem user={user}></YiqiaCreateContactItem>
                            })
                        }
                    </AutoHideScrollbar>
                </div>
            </BaseDialog>
        )
    }
}

export default YiqiaAddContactDialog;