/*
Copyright 2015-2018, 2020, 2021 The Matrix.org Foundation C.I.C.

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

import React, { createRef } from "react";
import { Room } from "matrix-js-sdk/src/models/room";

import { _t, _td } from "../../../languageHandler";
import { IState as IRovingTabIndexState, RovingTabIndexProvider } from "../../../accessibility/RovingTabIndex";
import ResizeNotifier from "../../../utils/ResizeNotifier";
import RoomListStore from "../../../stores/room-list/RoomListStore";
import RoomViewStore from "../../../stores/RoomViewStore";
import defaultDispatcher from "../../../dispatcher/dispatcher";
import { ActionPayload } from "../../../dispatcher/payloads";
import { Action } from "../../../dispatcher/actions";
import { ViewRoomDeltaPayload } from "../../../dispatcher/payloads/ViewRoomDeltaPayload";
import { RoomNotificationStateStore } from "../../../stores/notifications/RoomNotificationStateStore";
import { replaceableComponent } from "../../../utils/replaceableComponent";
import MatrixClientContext from "../../../contexts/MatrixClientContext";
import { ViewRoomPayload } from "../../../dispatcher/payloads/ViewRoomPayload";
import { ContactTagId } from "../../../models/YiqiaModels";
import AccessibleButton from "../elements/AccessibleButton";
import { ViewYiqiaContactPayload, ViewYiqiaOrganizationPayload, ViewYiqiaRecentsPayload } from "../../../dispatcher/payloads/ViewYiqiaContactPayload";
import AutoHideScrollbar from "../../structures/AutoHideScrollbar";
import YiqiaContactUserStore from "../../../stores/YiqiaContactUserStore";
import YiqiaOrganizationComponent from "./YiqiaOrganizationComponent";

interface IProps {
    onKeyDown: (ev: React.KeyboardEvent, state: IRovingTabIndexState) => void;
    onFocus: (ev: React.FocusEvent) => void;
    onBlur: (ev: React.FocusEvent) => void;
    onResize: () => void;
    onListCollapse?: (isExpanded: boolean) => void;
    resizeNotifier: ResizeNotifier;
    isMinimized: boolean;
}

interface IState {
    currentSelectedItem?: string;
}

const Contact_Item: ContactTagId[] = [
    ContactTagId.Recent,
    ContactTagId.Contact,
    ContactTagId.Organization,
    ContactTagId.Teams,
]

export const ACTIVE_CONTACT_ITEM = "yiqia_contact_active_item";

@replaceableComponent("views.rooms.YiqiaContactInterface")
export default class YiqiaContactInterface extends React.PureComponent<IProps, IState> {
    private dispatcherRef;
    private treeRef = createRef<HTMLDivElement>();

    static contextType = MatrixClientContext;
    public context!: React.ContextType<typeof MatrixClientContext>;

    constructor(props: IProps) {
        super(props);
        this.onContactClick = this.onContactClick.bind(this);
        this.state = {
        }
    }

    public componentDidMount(): void {
        const lastActiveContactItem = window.localStorage.getItem(ACTIVE_CONTACT_ITEM) || ContactTagId.Recent;
        this.dispatcherRef = defaultDispatcher.register(this.onAction);
        this.setActiveContactItem(lastActiveContactItem);
    }

    public setActiveContactItem = (item: string): void => {
        localStorage.setItem(ACTIVE_CONTACT_ITEM, item);
        switch(item) {
            case ContactTagId.Recent:
                YiqiaContactUserStore.instance.setCurItem(item);
                defaultDispatcher.dispatch<ViewYiqiaRecentsPayload>({
                    action: Action.ViewYiqiaRecent
                });
                break;
            case ContactTagId.Contact:
                YiqiaContactUserStore.instance.setCurItem(item);
                defaultDispatcher.dispatch<ViewYiqiaContactPayload>({
                    action: Action.ViewYiqiaContact
                });
                break;
            case ContactTagId.Organization:
                YiqiaContactUserStore.instance.setCurItem(item);
                defaultDispatcher.dispatch<ViewYiqiaOrganizationPayload>({
                    action: Action.ViewYiqiaOrgMembers
                });
                break;
            case ContactTagId.Teams:
        }
    }

    public componentWillUnmount() {
        defaultDispatcher.unregister(this.dispatcherRef);
    }

    private onAction = (payload: ActionPayload) => {
        if (payload.action === Action.ViewRoomDelta) {
            const viewRoomDeltaPayload = payload as ViewRoomDeltaPayload;
            const currentRoomId = RoomViewStore.getRoomId();
            const room = this.getRoomDelta(currentRoomId, viewRoomDeltaPayload.delta, viewRoomDeltaPayload.unread);
            if (room) {
                defaultDispatcher.dispatch<ViewRoomPayload>({
                    action: Action.ViewRoom,
                    room_id: room.roomId,
                    show_room_tile: true, // to make sure the room gets scrolled into view
                    metricsTrigger: "WebKeyboardShortcut",
                    metricsViaKeyboard: true,
                });
            }
        }
    };

    private getRoomDelta = (roomId: string, delta: number, unread = false) => {
        const lists = RoomListStore.instance.orderedLists;
        const rooms: Room[] = [];
        Contact_Item.forEach(t => {
            let listRooms = lists[t];

            if (unread) {
                // filter to only notification rooms (and our current active room so we can index properly)
                listRooms = listRooms.filter(r => {
                    const state = RoomNotificationStateStore.instance.getRoomState(r);
                    return state.room.roomId === roomId || state.isUnread;
                });
            }

            rooms.push(...listRooms);
        });

        const currentIndex = rooms.findIndex(r => r.roomId === roomId);
        // use slice to account for looping around the start
        const [room] = rooms.slice((currentIndex + delta) % rooms.length);
        return room;
    };

    public focus(): void {
        // focus the first focusable element in this aria treeview widget
        const treeItems = this.treeRef.current?.querySelectorAll<HTMLElement>('[role="treeitem"]');
        if (treeItems) {
            return;
        }
        [...treeItems]
            .find(e => e.offsetParent !== null)?.focus();
    }

    private onRecentsClick = () => {
        this.setActiveContactItem(ContactTagId.Recent);
        console.log("on recent");
    }

    private onContactClick = () => {
        this.setActiveContactItem(ContactTagId.Contact);
        console.log("on contact");
    }

    private onOrganizationClick = () => {
        this.setActiveContactItem(ContactTagId.Organization);
        console.log("on organization");
    }

    private recentsItem(): React.ReactElement {
        return (
            <div className="yiqia_contact_item">
                <img className="yiqia_contact_icon" src={require("../../../../res/img/yiqia-contact-book/yiqia_recents.svg").default}></img>
                <AccessibleButton
                    title={_t("Recents")}
                    onFocus={this.props.onFocus}
                    className="yiqia_ContactItem"
                    onClick={this.onRecentsClick}>
                        {_t("Recents")}
                </AccessibleButton>
            </div>
        );
    }

    private contactItem(): React.ReactElement {
        return (
            <div className="yiqia_contact_item">
                <img className="yiqia_contact_icon" src={require("../../../../res/img/yiqia-contact-book/yiqia_contact.svg").default}></img>
                <AccessibleButton
                    title={_t("Contacts")}
                    onFocus={this.props.onFocus}
                    className="yiqia_ContactItem"
                    onClick={this.onContactClick}>
                        {_t("Contacts")}
                </AccessibleButton>
            </div>
        );
    }

    private OrgItem(): React.ReactElement {
        return (
            <React.Fragment>
                <div className="yiqia_contact_item">
                    <img className="yiqia_contact_icon" src={require("../../../../res/img/yiqia-contact-book/yiqia_organization.svg").default}></img>
                    <AccessibleButton
                        title={_t("Contacts")}
                        onFocus={this.props.onFocus}
                        className="yiqia_ContactItem"
                        onClick={this.onOrganizationClick}>
                            {_t("Organization")}
                    </AccessibleButton>
                </div>
                <YiqiaOrganizationComponent></YiqiaOrganizationComponent>
            </React.Fragment>
        )
    }

    public render() {
        return (
            <AutoHideScrollbar>
                <div className="yiqia_ContactTitle">
                    {_t("Contact")}
                </div>
                <RovingTabIndexProvider handleHomeEnd handleUpDown onKeyDown={this.props.onKeyDown}>
                    { ({ onKeyDownHandler }) => (
                        <div
                            onFocus={this.props.onFocus}
                            onBlur={this.props.onBlur}
                            onKeyDown={onKeyDownHandler}
                            className="yiqia_ItemList"
                            role="tree"
                            aria-label={_t("Rooms")}
                            ref={this.treeRef}
                        >
                            { this.recentsItem() }
                            { this.contactItem() }
                            { this.OrgItem() }
                        </div>
                    ) }
                </RovingTabIndexProvider>
            </AutoHideScrollbar>
        );
    }
}
