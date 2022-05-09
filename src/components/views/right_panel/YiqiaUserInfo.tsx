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
            className="mx_UserInfo_field"
            disabled={busy}
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
            metricsTrigger: "MessageUser",
        });
        return;
    }
}

const VoIPButton = ({ userId, operate }: { userId: string, operate: YiqiaUserInfoOperate}) => {
    const cli = useContext(MatrixClientContext);
    const [busy, setBusy] = useState(false);

    return (
        <AccessibleButton
            onClick={async (ev) => {
                if (busy) return;
                setBusy(true);
                await openVoIP(cli, userId, operate);
                setBusy(false);
            }}
            className="mx_UserInfo_field"
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
        <div className="mx_UserInfo_container">
            {
                hasOptions &&
                <h3>{ _t("Options") }</h3>
            }
            <div>
                { directMessageButton }
                { voiceButton }
                { videoButton }
            </div>
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

        Modal.createDialog(ImageView, params, "mx_Dialog_lightbox", null, true);
    }, [user]);

    const avatarElement = (
        <div className="mx_UserInfo_avatar">
            <div>
                <div>
                    <BaseAvatar
                        key={user.matrixId} // to instantly blank the avatar when UserInfo changes members
                        name={user.DisplayName}
                        title={user.matrixId}
                        idName={user.matrixId}
                        url={user.avatarTUrl}
                        onClick={onMemberAvatarClick}/>
                </div>
            </div>
        </div>
    );

    const displayName = user.DisplayName;
    return (
        <React.Fragment>
            { avatarElement }

            <div className="mx_UserInfo_container mx_UserInfo_separator">
                <div className="mx_UserInfo_profile">
                    <div>
                        <span title={displayName} aria-label={displayName}>
                            { displayName }
                        </span>
                        <span title={user.matrixId} aria-label={displayName}>
                            { user.matrixId }
                        </span>
                    </div>
                </div>
            </div>
        </React.Fragment>
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
            <aside className="mx_RightPanel dark-panel" id="mx_RightPanel">
                { <YiqiaUserInfoContent user={this.state.user} onClose={this.props.onClose} />}
            </aside>
        )
    }
}

const YiqiaUserInfoContent: React.FC<IProps2> = ({
    user,
    onClose,
    ...props
}) => {
    const classes = ["mx_UserInfo"];

    const closeButton = <AccessibleButton
            data-test-id='base-card-close-button'
            className="mx_BaseCard_close"
            onClick={onClose}
            title={_t("Close")}
        />;


    return <div className=''>
            {closeButton}
            <UserInfoHeader user={user}></UserInfoHeader>
            <UserOptionsSection user={user}></UserOptionsSection>
        </div>
};

export default YiqiaUserInfo;
