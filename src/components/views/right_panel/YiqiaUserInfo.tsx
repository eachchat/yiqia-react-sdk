/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 Vector Creations Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MatrixClient } from 'matrix-js-sdk/src/client';

import dis from '../../../dispatcher/dispatcher';
import Modal from '../../../Modal';
import { _t } from '../../../languageHandler';
import createRoom, { findDMForUser, privateShouldBeEncrypted } from '../../../createRoom';
import AccessibleButton from '../elements/AccessibleButton';
import MatrixClientContext from "../../../contexts/MatrixClientContext";
import { Action } from "../../../dispatcher/actions";
import ImageView from "../elements/ImageView";
import { mediaFromMxc } from "../../../customisations/Media";
import { ViewRoomPayload } from "../../../dispatcher/payloads/ViewRoomPayload";
import { ContactTagId, UserModal } from '../../../models/YiqiaModels';
import BaseAvatar from '../avatars/BaseAvatar';
import { useEventEmitter } from '../../../hooks/useEventEmitter';
import YiqiaUserRightPanelStore from '../../../stores/YiqiaUserRightPanelStore';
import { UPDATE_EVENT } from '../../../stores/AsyncStore';
import { objectClone, objectHasDiff } from '../../../utils/objects';
import { YiqiaContactContactStore } from '../../../stores/YiqiaContactContactStore';
import { YiqiaContact } from '../../../utils/yiqiaUtils/YiqiaContact';
import classNames from 'classnames';
import YiqiaOrganizationStore from '../../../stores/YiqiaOrganizationStore';
import YiqiaContactUserStore from '../../../stores/YiqiaContactUserStore';
import YiqiaCreateContact from '../dialogs/YiqiaCreateContactDialog';

export interface IDevice {
    deviceId: string;
    ambiguous?: boolean;
    getDisplayName(): string;
}

enum YiqiaUserInfoOperate {
    "VOICE",
    "VIDEO"
};

async function openDMForUser(matrixClient: MatrixClient, userId: string, viaKeyboard = false): Promise<void> {
    const lastActiveRoom = findDMForUser(matrixClient, userId);

    if (lastActiveRoom) {
        dis.dispatch<ViewRoomPayload>({
            action: Action.ViewRoom,
            room_id: lastActiveRoom.roomId,
            metricsTrigger: "MessageUserFromContact",
            metricsViaKeyboard: viaKeyboard,
        });
        return;
    }

    const createRoomOptions = {
        dmUserId: userId,
        encryption: undefined,
    };

    if (privateShouldBeEncrypted()) {
        // Check whether all users have uploaded device keys before.
        // If so, enable encryption in the new room.
        const usersToDevicesMap = await matrixClient.downloadKeys([userId]);
        const allHaveDeviceKeys = Object.values(usersToDevicesMap).every(devices => {
            // `devices` is an object of the form { deviceId: deviceInfo, ... }.
            return Object.keys(devices).length > 0;
        });
        if (allHaveDeviceKeys) {
            createRoomOptions.encryption = true;
        }
    }

    await createRoom(createRoomOptions);
}

const MessageButton = ({ userId }: { userId: string }) => {
    const cli = useContext(MatrixClientContext);
    const [busy, setBusy] = useState(false);

    return (
        <AccessibleButton
            onClick={async (ev) => {
                if (busy) return;
                setBusy(true);
                await openDMForUser(cli, userId, ev.type !== "click");
                setBusy(false);
            }}
            className="yiqia_UserInfo_field yiqia_UserInfo_field_message"
            disabled={busy || !userId}
        >
            { _t("Message") }
        </AccessibleButton>
    );
};

async function openVoIP(matrixClient: MatrixClient, userId: string, operate:YiqiaUserInfoOperate): Promise<void> {
    const lastActiveRoom = findDMForUser(matrixClient, userId);

    if (lastActiveRoom) {
        dis.dispatch<ViewRoomPayload>({
            action: Action.ViewRoom,
            show_room_tile: true,
            room_id: lastActiveRoom.roomId,
            metricsTrigger: operate === YiqiaUserInfoOperate.VIDEO ? "CallVideo" : "CallAudio",
            deferred_action: {
                action: Action.ViewRoom,
                room_id: lastActiveRoom.roomId,
                context_switch: true,
                metricsTrigger: operate === YiqiaUserInfoOperate.VIDEO ? "CallVideo" : "CallAudio",
            },
        });
        return;
    }
}

const VoIPButton = ({ userId, operate }: { userId: string, operate: YiqiaUserInfoOperate}) => {
    const cli = useContext(MatrixClientContext);
    const [busy, setBusy] = useState(false);

    const classname = operate === YiqiaUserInfoOperate.VOICE ? "yiqia_UserInfo_field yiqia_UserInfo_field_voip_audio" : "yiqia_UserInfo_field yiqia_UserInfo_field_voip_video"
    const buttonText = operate === YiqiaUserInfoOperate.VOICE ? _t("Call Voice") : _t("Call Video");

    return (
        <AccessibleButton
            onClick={async (ev) => {
                if (busy) return;
                setBusy(true);
                await openVoIP(cli, userId, operate);
                setBusy(false);
            }}
            className={classname}
            disabled={busy}
        >
            { buttonText }
        </AccessibleButton>
    );
};

const UserOptionsSection: React.FC<{
    user: UserModal;
}> = ({ user }) => {
    const cli = useContext(MatrixClientContext);

    let directMessageButton = null;
    let voiceButton = null;
    let videoButton = null;
    let hasOptions = false;

    const isMe = user.matrixId === cli.getUserId();
    const canVoIP = !!findDMForUser(cli, user.matrixId);


    if (!isMe) {
        directMessageButton = <MessageButton userId={user.matrixId} />;
        hasOptions = true;
    }

    if(canVoIP) {
        voiceButton = <VoIPButton userId={user.matrixId} operate={YiqiaUserInfoOperate.VOICE}></VoIPButton>
        videoButton = <VoIPButton userId={user.matrixId} operate={YiqiaUserInfoOperate.VIDEO}></VoIPButton>
        hasOptions = true;
    }
    
    return (
        <div className="yiqia_UserInfo_operate_container">
                { directMessageButton }
                {
                    YiqiaContactContactStore.Instance.isUserInContact(user) &&
                    voiceButton
                }
                {
                    YiqiaContactContactStore.Instance.isUserInContact(user) &&
                    videoButton
                }
        </div>
    );
};

const UserInfoHeader: React.FC<{
    user: UserModal;
}> = ({ user }) => {
    const onMemberAvatarClick = useCallback(() => {
        let avatarUrl = "";
        // avatarUrl = (member as RoomMember).getMxcAvatarUrl
        //     ? (member as RoomMember).getMxcAvatarUrl()
        //     : (member as User).avatarUrl;
        if (!avatarUrl) return;

        const httpUrl = mediaFromMxc(avatarUrl).srcHttp;
        const params = {
            src: httpUrl,
            name: user.displayName,
        };

        Modal.createDialog(ImageView, params, "yiqia_Dialog_lightbox", null, true);
    }, [user]);

    const httpUrl = (user.avatarUrl || user.photoUrl) ? mediaFromMxc(user.avatarUrl || user.photoUrl).srcHttp : "";
    const avatarElement = (
        <div className="yiqia_UserInfo_avatar">
            <div>
                <BaseAvatar
                    key={user.matrixId} // to instantly blank the avatar when UserInfo changes members
                    name={user.DisplayName}
                    title={user.matrixId}
                    idName={user.matrixId}
                    url={httpUrl}
                    onClick={onMemberAvatarClick}/>
            </div>
        </div>
    );

    const displayName = user.DisplayName;
    if(!displayName) {
        console.log("0000000")
    }
    return (
        <div className='yiqia_RightPanel_header'>
            { avatarElement }

            <div className="yiqia_UserInfo_container">
                <div className="yiqia_UserInfo_profile">
                    <div className="yiqia_UserInfo_displayname" title={displayName} aria-label={displayName}>
                        { displayName }
                    </div>
                    <div className="yiqia_UserInfo_matrixId" title={user.matrixId} aria-label={displayName}>
                        { user.matrixId }
                    </div>
                </div>
            </div>
        </div>
    )
};

interface IProps1 {
    onClose(): void;
    onPageUpdate(): void;
};

interface IProps2 {
    onClose(): void;
    user: UserModal;
    updatePage(): void;
};

interface IState {
    user: UserModal;
};

class YiqiaUserInfo extends React.Component<IProps1, IState> {
    constructor(props) {
        super(props)

        this.state = {
            user: YiqiaUserRightPanelStore.Instance.curUser,
        }
    }

    componentDidMount(): void {
        YiqiaUserRightPanelStore.Instance.on(UPDATE_EVENT, this.shouldPageUpdate)
    }

    componentWillUnmount(): void {
        YiqiaUserRightPanelStore.Instance.removeListener(UPDATE_EVENT, this.shouldPageUpdate.bind)
    }

    protected shouldPageUpdate = () => {
        const newUser = YiqiaUserRightPanelStore.Instance.curUser;
        const curUser = this.state.user;
        if(objectHasDiff(newUser, curUser)) {
            this.setState({
                user: newUser,
            })
        }
    }

    private updatePage = () => {
        this.props.onPageUpdate();
        const newUser = YiqiaUserRightPanelStore.Instance.curUser;
        console.log("newUser ", newUser);
        this.setState({
            user: newUser,
        })
    }

    public render(): JSX.Element {
        return (
            <aside className="yiqia_RightPanel dark-panel" id="yiqia_RightPanel">
                { <YiqiaUserInfoContent user={this.state.user} onClose={this.props.onClose} updatePage={this.updatePage}/>}
            </aside>
        )
    }
}

const DetailsShowItems = ["nickName", "telephone", "email", "department", "title"];
const DetailsShowItemsWithReport = ["nickName", "telephone", "email", "department", "title", "report"];

const YiqiaUserDetailItem: React.FC<{itemLabel: string, itemContent: string}> = (props) => {
    let theContent = typeof props.itemContent === "string" ? (props.itemContent || "") : props.itemContent?.displayName || "";
    return (
        <div className='yiqia_user_details_item'>
            <div className='yiqia_user_details_item_label'>{props.itemLabel || ""}</div>
            <div className='yiqia_user_details_item_info'>{theContent || ""}</div>
        </div>
    )
}

const YiqiaUserDetails: React.FC<{user: UserModal}> = ({
    user,
}) => {

    const [expanded, setExpanded] = React.useState(false);
    const [showItems, setShowItems] = React.useState(DetailsShowItems);
    const [managerInfo, setManagerInfo] = React.useState(null);

    function getItemContent(itemLabel) {
        if(itemLabel === "telephone") {
            return user.Phones;
        } else if(itemLabel === "email") {
            return user.Emails;
        } else if(itemLabel === "department") {
            return user.department?.name || user.organization;
        } else if(itemLabel === "report") {
            console.log("======managerInfo ", managerInfo);
            return managerInfo;
        } else if(itemLabel === "nickName") {
            if(user.nickName && user.nickName.length > 0) return user.nickName;
            if(user.family && user.given) return user.family + user.given;
            if(user.family) return user.family;
            if(YiqiaContactContactStore.Instance.getContact(user)) return YiqiaContactContactStore.Instance.getContact(user).DisplayName;
            if(YiqiaOrganizationStore.Instance.getOrgInfo(user)) return YiqiaOrganizationStore.Instance.getOrgInfo(user).DisplayName;
            if(user.matrixId) return user.matrixId.slice(1,2);
        } else {
            return user[itemLabel];
        }
    }

    const collapseClasses = classNames({
        'yiqia_User_Details_See_More_collapseBtn': true,
        'yiqia_User_Details_See_More_collapseBtn_collapsed': expanded,
    });

    const onItemExpand = () => {
        if(expanded) {
            setShowItems(DetailsShowItems);
        } else {
            setManagerInfo(YiqiaOrganizationStore.Instance.TheManagerInfo(user));
        
            setShowItems(DetailsShowItemsWithReport);
        }
        setExpanded(!expanded);
    }

    useEffect(() => {
        setManagerInfo(YiqiaOrganizationStore.Instance.TheManagerInfo(user));
    }, [user])

    const seeMoreText = expanded ? "收起" : "显示更多";

    return (
        <div className='yiqia_User_Details'>
            {
                showItems.map(item => {
                    const itemLabel = _t(item);
                    const itemContent = getItemContent(item);
                    if(itemContent && itemContent.length > 0) {
                        return (
                            <YiqiaUserDetailItem key={item} itemLabel={itemLabel} itemContent={itemContent}></YiqiaUserDetailItem>
                        )
                    } else {
                        return null;
                    }
                })
            }
            {
                YiqiaOrganizationStore.Instance.hasReporter(user) &&
                <div className="yiqia_User_Details_See_More">
                    <span className="yiqia_User_Details_See_More_label" onClick={onItemExpand}>{ seeMoreText }</span>
                    <span className={collapseClasses} onClick={onItemExpand}/>
                </div>
            }
        </div>
    )
}

const YiqiaUserInfoContent: React.FC<IProps2> = ({
    user,
    onClose,
    ...props
}) => {
    const contactOperText = YiqiaContactContactStore.Instance.isUserInContact(user) ? _t("remove from my contact") : _t("add to my contact");
    const operClassName = YiqiaContactContactStore.Instance.isUserInContact(user) ? "yiqia_BaseCard_remove_from_contact" : "yiqia_BaseCard_add_to_contact";

    const closeButton = <AccessibleButton
            data-test-id='base-card-close-button'
            className="yiqia_BaseCard_close"
            onClick={onClose}
            title={_t("Close")}
        />;

    const contactOperate = () => {
        if(YiqiaContactContactStore.Instance.isUserInContact(user)) {
            YiqiaContact.Instance.yiqiaContactRemove(
                user
            ).then((res) => {
                YiqiaContactContactStore.Instance.generalContactsList()
                    .then((res) => {
                        props.updatePage();
                        onClose();
                    })
            })
        } else {
            YiqiaContact.Instance.yiqiaContactAdd(user).then(res => {
                YiqiaContactContactStore.Instance.generalContactsList()
                    .then((res) => {
                        props.updatePage();
                })
            })
        }
    }
    
    const contactEdit = async() => {
        const { finished } = Modal.createTrackedDialog("Add Contact", "", YiqiaCreateContact, {user: user});
        const result = await finished;
    }
    
    const editContactButton = <AccessibleButton
            className="yiqia_BaseCard_edit_contact"
            onClick={contactEdit}
            title={_t("edit contact")}>
                <span>{ _t("edit contact") }</span>
            </AccessibleButton>

    const removeContactButton = <AccessibleButton
            className={operClassName}
            onClick={contactOperate}
            title={contactOperText}>
                <span>{ contactOperText }</span>
            </AccessibleButton>

    return <div className='yiqia_UserInfo'>
        <div className='yiqia_BaseCard_header'>
            {closeButton}
        </div>
            <UserInfoHeader user={user}></UserInfoHeader>
            <UserOptionsSection user={user}></UserOptionsSection>
            <YiqiaUserDetails user={user}></YiqiaUserDetails>
            {
                YiqiaContactUserStore.instance.curItem === ContactTagId.Contact &&
                editContactButton
            }
            {removeContactButton}
        </div>
};

export default YiqiaUserInfo;
