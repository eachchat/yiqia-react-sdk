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
import { UserModal } from '../../../models/YiqiaModels';
import BaseAvatar from '../avatars/BaseAvatar';
import { useEventEmitter } from '../../../hooks/useEventEmitter';
import YiqiaUserRightPanelStore from '../../../stores/YiqiaUserRightPanelStore';
import { UPDATE_EVENT } from '../../../stores/AsyncStore';
import { objectClone, objectHasDiff } from '../../../utils/objects';
import { YiqiaContactContactStore } from '../../../stores/YiqiaContactContactStore';
import { YiqiaContact } from '../../../utils/yiqiaUtils/YiqiaContact';

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
            metricsTrigger: "MessageUser",
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
            disabled={busy || !!userId}
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
            room_id: lastActiveRoom.roomId,
            metricsTrigger: operate === YiqiaUserInfoOperate.VIDEO ? "CallVideo" : "CallAudio",
        });
        return;
    }
}

const VoIPButton = ({ userId, operate }: { userId: string, operate: YiqiaUserInfoOperate}) => {
    const cli = useContext(MatrixClientContext);
    const [busy, setBusy] = useState(false);

    const classname = operate === YiqiaUserInfoOperate.VOICE ? "yiqia_UserInfo_field yiqia_UserInfo_field_voip_audio" : "yiqia_UserInfo_field yiqia_UserInfo_field_voip_video"

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
            { _t("Message") }
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

    const avatarElement = (
        <div className="yiqia_UserInfo_avatar">
            <div>
                <BaseAvatar
                    key={user.matrixId} // to instantly blank the avatar when UserInfo changes members
                    name={user.DisplayName}
                    title={user.matrixId}
                    idName={user.matrixId}
                    url={user.photoUrl}
                    onClick={onMemberAvatarClick}/>
            </div>
        </div>
    );

    const displayName = user.DisplayName;
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
};

interface IProps2 {
    onClose(): void;
    user: UserModal;
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

    public render(): JSX.Element {
        return (
            <aside className="yiqia_RightPanel dark-panel" id="yiqia_RightPanel">
                { <YiqiaUserInfoContent user={this.state.user} onClose={this.props.onClose} />}
            </aside>
        )
    }
}

const DetailsShowItems = ["DisplayName", "nickName", "telephone", "email", "department", "title"];

const YiqiaUserDetailItem: React.FC<{itemLabel: string, itemContent: string}> = (props) => {
    const theContent = typeof props.itemContent === "string" ? (props.itemContent || "") : props.itemContent?.displayName || "";
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

    function getItemContent(itemLabel) {
        if(itemLabel === "telephone") {
            return user.telephoneList ? user.telephoneList[0]?.value || "" : "";
        } else if(itemLabel === "email") {
            return user.emailList ? user.emailList[0]?.value || "" : "";
        } else {
            return user[itemLabel];
        }
    }

    return (
        <div className='yiqia_User_Details'>
            {
                DetailsShowItems.map(item => {
                    const itemLabel = _t(item);
                    const itemContent = getItemContent(item);
                    return (
                        <YiqiaUserDetailItem key={item} itemLabel={itemLabel} itemContent={itemContent}></YiqiaUserDetailItem>
                    )
                })
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
                YiqiaContactContactStore.Instance.generalContactsList();
            })
        } else {
            YiqiaContact.Instance.yiqiaContactAdd(user).then(res => {
                YiqiaContactContactStore.Instance.generalContactsList();
            })
        }
    }
    
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
            {removeContactButton}
        </div>
};

export default YiqiaUserInfo;
