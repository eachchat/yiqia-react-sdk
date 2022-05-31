/*
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2015-2017, 2019-2021 The Matrix.org Foundation C.I.C.

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
import { User } from "matrix-js-sdk/src/models/user";
import { RoomMember } from "matrix-js-sdk/src/models/room-member";
import React from "react";
import { UserModal } from "../../../models/YiqiaModels";
import MemberAvatar from "../avatars/MemberAvatar";
import YiqiaUserRightPanelStore from "../../../stores/YiqiaUserRightPanelStore";

interface IProps {
    userItem: UserModal,
    descriptType: DescriptType,
}

export enum DescriptType {
    Title,
    MatrixId,
}

export type Member = User | RoomMember;

export default function YiqiaUserItem(props:IProps) {
    const member:Member = props.userItem.Room && props.userItem.Room.getMember(props.userItem.matrixId);

    function onMemberClick() {
        console.log("------- ", props.userItem)
        YiqiaUserRightPanelStore.Instance.setCurd(props.userItem);
    }

    const getUserAvatar = (
        <div className="yiqia_ConatctUserInfo_avatar">
            <div>
                <div>
                    <MemberAvatar
                        key={props.userItem.matrixId} // to instantly blank the avatar when UserInfo changes members
                        member={member as RoomMember}
                        width={32} // 2x@30vh
                        height={32} // 2x@30vh
                        resizeMethod="scale"
                        fallbackUserId={member ? member.userId : props.userItem.matrixId || props.userItem.DisplayName}
                        urls={(member as unknown as User)?.avatarUrl ? [(member as unknown as User)?.avatarUrl] : undefined} />
                </div>
            </div>
        </div>
    );

    // console.log("========= props.userItem ", props.userItem);
    // console.log("========= props.userItem.DisplayName ", props.userItem.DisplayName);


    let nameContainer:React.ReactNode = (
        <div className="yiqia_ContactUser_nameContainer">
            <div className="yiqia_ContactUser_namt_text" title={props.userItem.DisplayName} tabIndex={-1} dir="auto">
                { props.userItem.DisplayName }
            </div>
        </div>
    );
    
    let description:React.ReactNode = (
        <div className="yiqia_ContactUser_descriptionContainer">
            <div className="yiqia_ContactUser_title_text" title={props.userItem.title } tabIndex={-1} dir="auto">
                { props.descriptType === DescriptType.Title &&
                    props.userItem.title 
                }
                { props.descriptType !== DescriptType.Title &&
                    props.userItem.matrixId 
                }
            </div>
        </div>
    );

    return(
        <div className="yiqia_UserItem" onClick={onMemberClick}>
            { getUserAvatar }
            <div className="yiqia_contact_useritem_container">
                { nameContainer }
                { description }
            </div>
        </div>
    )
}