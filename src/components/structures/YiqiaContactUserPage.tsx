/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as React from "react";

import { _t, _tDom } from "../../languageHandler";
import YiqiaContactUserStore, { UPDATE_SELECTED_CONTACT_ITEM } from "../../stores/YiqiaContactUserStore";
import { ContactTagId, UserModal } from "../../models/YiqiaModels";
import YiqiaContactUserSearch from "./YiqiaContactUserSearch";
import MainSplit from "./MainSplit";
import ResizeNotifier from "../../utils/ResizeNotifier";
import YiqiaContactUserList from "../views/yiqia/YiqiaContactUserList";
import { useState } from "react";
import { useEventEmitter } from "../../hooks/useEventEmitter";
import YiqiaUserInfo from "../views/right_panel/YiqiaUserInfo";
import YiqiaUserRightPanelStore from "../../stores/YiqiaUserRightPanelStore";
import { UPDATE_EVENT } from "../../stores/AsyncStore";
import { objectHasDiff } from "../../utils/objects";
import { mapHasDiff } from "../../utils/maps";
import YiqiaContactUserTitle from "./YiqiaContactUserTitle";
import { YiqiaContact } from "../../utils/yiqiaUtils/YiqiaContact";
import pinyin from 'pinyin';
import YiqiaRecentsStore from "../../stores/YiqiaRecentsStore";

interface IProps {
    resizeNotifier: ResizeNotifier;
}

const YiqiaContactUserPage: React.FC<IProps> = (props) => {
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [users, setUsers] = useState(new Map()); //<Map<string, UserModal[]>
    
    useEventEmitter(YiqiaContactUserStore.instance, UPDATE_SELECTED_CONTACT_ITEM, () => {
        pageForceUpdate();
    });
    useEventEmitter(YiqiaContactUserStore.instance, UPDATE_EVENT, () => {
        pageForceUpdate();
    });
    useEventEmitter(YiqiaUserRightPanelStore.Instance, UPDATE_EVENT, () => {
        righaPanelShouldUpdate();
    });

    function getBGColorFromDisplayName(displayName) {
        let firstCharacterInUpper = "";
        let isZh = false;
        const firstText = displayName.slice(0, 1);
    
        if(firstText.charCodeAt(0) > 255) {
            firstCharacterInUpper = pinyin(firstText)[0][0].slice(0, 1).toUpperCase();
            isZh = true;
        }
        else {
            firstCharacterInUpper = firstText.toUpperCase();
            isZh = false;
        }
    
        return firstCharacterInUpper;
    }
    
    function onSearchInputChange(term:string) {
        if(term.length == 0) {
            setUsers(YiqiaContactUserStore.instance.usersList);
        } else if(YiqiaContactUserStore.instance.curItem === ContactTagId.Organization && YiqiaContactUserStore.instance.usersList.size === 0) {
            YiqiaContact.Instance.yiqiaGmsSearch(term).then(async(gmsResult) => {
                const checkTerm = term;
                if(term.trim().length === 0) {
                    return;
                }

                console.log("gmsResult is ", gmsResult);
                if(gmsResult.length !== 0) {
                    let dealedResult:UserModal[] = [];
                    for(let i = 0; i < gmsResult.length; i++) {
                        if(term.trim().length === 0 && term !== checkTerm) break;
                        const u = gmsResult[i];
                        let profile;
                        const uModal = new UserModal(u.matrixId, u.displayName, profile?.avatar_url);
                        const gmsUserInfo = await YiqiaRecentsStore.Instance.updateItemFromGms(uModal);
                        if(gmsUserInfo) {
                            if(uModal.updateProperty(gmsUserInfo)) {
                                dealedResult.push(uModal);
                            }
                        }
                    }

                    console.log("dealedResult ", dealedResult);
                    const dealedDate:Map<string, UserModal[]> = new Map();
                    dealedResult.forEach(item => {
                        if(item.del == 1 && term !== checkTerm) return;
                        let firstLetter = "a";
                        try{
                            firstLetter = getBGColorFromDisplayName(item.DisplayName);
                        } catch(err) {
                            console.log("========== error item ", item.DisplayName);
                        }
                        if(dealedDate.has(firstLetter)) {
                            dealedDate.get(firstLetter).push(item);
                        } else {
                            dealedDate.set(firstLetter, [item]);
                        }
                    })
                    setUsers(new Map([...dealedDate.entries()].sort()));
                }
            });
        } else {
            const origin = YiqiaContactUserStore.instance.usersList;
            const newUsers = new Map();
            for(const item of origin) {
                const users = item[1];
                for(const user of users) {
                    if((user.DisplayName + user.additionalName + user.family + user.firstName + user.formattedName + user.given + 
                        user.lastName + user.prefixes + user.middleName + user.nickName + user.suffixes).indexOf(term) >= 0) {
                            if(!newUsers.has(item[0])) {
                                newUsers.set(item[0], []);
                            }
                            newUsers.set(item[0], [...newUsers.get(item[0]), user]);
                        }
                }
            }
            setUsers(newUsers);
        }
    }

    const righaPanelShouldUpdate = () => {
        setShowRightPanel(true);
    }

    const rightPanelClose= () => {
        setShowRightPanel(false);
    }

    const pageShouldUpdate = () => {
        const curUsers = YiqiaContactUserStore.instance.usersList;
        console.log("pageShouldUpdate objectHasDiff ", objectHasDiff(curUsers, users));
        console.log("pageShouldUpdate curUsers ", curUsers);
        console.log("pageShouldUpdate users ", users);
        if(mapHasDiff(curUsers, users)) {
            setUsers(curUsers);
        }
    }

    const pageForceUpdate = () => {
        const curUsers = YiqiaContactUserStore.instance.usersList;
        console.log("pageForceUpdate curUsers ", curUsers);
        setUsers(curUsers);
    }

    React.useEffect(() => {
        pageShouldUpdate();
    }, [])

    function getTitle(): React.ReactNode{
        let title = _t("Recents");
        switch(YiqiaContactUserStore.instance.curItem) {
            case ContactTagId.Recent:
                title = _t("Recents");
                break;
            case ContactTagId.Contact:
                title = _t("Contacts");
                break;
            case ContactTagId.Organization:
                title = _t("Organization");
                break;
            case ContactTagId.Teams:
                title = _t("Teams");
                break;
        }
        return (
            <div>
                { title }
            </div>
        )
    }

    function renderContactSearchComponent(): React.ReactNode {
        return (
            <div className="yiqia_ContactUser_filterContainer">
                <YiqiaContactUserSearch onSelectUser={function (): boolean {
                    throw new Error("Function not implemented.");
                } } onSearch={function (): string {
                    throw new Error("Function not implemented.");
                } } onInputChange={onSearchInputChange.bind(this)}
            />
            </div>
        )
    }
    
    const rightPanel = showRightPanel
        ? <YiqiaUserInfo 
            onClose={rightPanelClose}
            onPageUpdate={pageForceUpdate} />
        : null;

    return <React.Fragment>
            <YiqiaContactUserTitle onPageUpdate={pageForceUpdate} />
            <MainSplit panel={rightPanel} resizeNotifier={props.resizeNotifier}>
                <div className="yiqia_ContactUser_body">
                    { renderContactSearchComponent() }
                    <YiqiaContactUserList 
                        users={users}
                    />
                </div>
            </MainSplit>
        </React.Fragment>;
};

export default YiqiaContactUserPage;
