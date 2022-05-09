/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 Vector Creations Ltd
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
import { createRef } from "react";
import classNames from 'classnames';
import { Dispatcher } from "flux";

import { _t } from "../../../languageHandler";
import RoomListStore, { LISTS_UPDATE_EVENT } from "../../../stores/room-list/RoomListStore";
import defaultDispatcher from "../../../dispatcher/dispatcher";
import { ActionPayload } from "../../../dispatcher/payloads";
import { polyfillTouchEvent } from "../../../@types/polyfill";
import { arrayFastClone, arrayHasDiff, arrayHasOrderChange } from "../../../utils/arrays";
import { objectExcluding, objectHasDiff } from "../../../utils/objects";
import { replaceableComponent } from "../../../utils/replaceableComponent";
import YiqiaContactUserStore from "../../../stores/YiqiaContactUserStore";
import YiqiaUserItem from "./YiqiaUserItem";
import { UserModal } from "../../../models/YiqiaModels";
import YiqiaRecentsStore, { UPDATE_RECENT_EVENT } from "../../../stores/YiqiaRecentsStore";

export const HEADER_HEIGHT = 32; // As defined by CSS

// HACK: We really shouldn't have to do this.
polyfillTouchEvent();

export interface IAuxButtonProps {
    tabIndex: number;
    dispatcher?: Dispatcher<ActionPayload>;
}

interface IProps {
    showSkeleton?: boolean;
}

type PartialDOMRect = Pick<DOMRect, "left" | "top" | "height">;

interface IState {
    contextMenuPosition: PartialDOMRect;
    height: number;
    users: UserModal[];
    initCollapse?: boolean;
}

@replaceableComponent("views.rooms.YiqiaContactUserList")
export default class YiqiaContactUserList extends React.Component<IProps, IState> {
    private sublistRef = createRef<HTMLDivElement>();
    private tilesRef = createRef<HTMLDivElement>();
    private dispatcherRef: string;
    private isBeingFiltered: boolean;

    constructor(props: IProps) {
        super(props);

        this.isBeingFiltered = !!RoomListStore.instance.getFirstNameFilterCondition();
        this.state = {
            contextMenuPosition: null,
            height: 0, // to be fixed in a moment, we need `rooms` to calculate this.
            users: arrayFastClone(YiqiaContactUserStore.instance.usersList || []),
            initCollapse: false,
        };
    }

    public componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>) {
        const stateUpdate: IState & any = {};
        const curUsers = this.state.users;
        const nextUsers = arrayFastClone(YiqiaContactUserStore.instance.usersList || []);
        if(arrayHasDiff(curUsers, nextUsers)) {
            stateUpdate.users = nextUsers;
            this.setState(stateUpdate);
        }
    }

    // public shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<IState>): boolean {
        // if (objectHasDiff(this.props, nextProps)) {
        //     // Something we don't care to optimize has updated, so update.
        //     return true;
        // }

        // // Do the same check used on props for state, without the users we're going to no-op
        // const prevStateNoRooms = objectExcluding(this.state, ['users']);
        // const nextStateNoRooms = objectExcluding(nextState, ['users']);
        // if (objectHasDiff(prevStateNoRooms, nextStateNoRooms)) {
        //     return true;
        // }

        // // Quickly double check we're not about to break something due to the number of users changing.
        // if (this.state.users.length !== nextState.users.length) {
        //     return true;
        // }

        // // Finally, nothing happened so no-op the update
        // return false;
    // }

    public componentDidMount() {
        this.dispatcherRef = defaultDispatcher.register(this.onAction);
        RoomListStore.instance.on(LISTS_UPDATE_EVENT, this.onListsOrderUpdated);
        // Using the passive option to not block the main thread
        // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scrolling_performance_with_passive_listeners
        this.tilesRef.current?.addEventListener("scroll", this.onScrollPrevent, { passive: true });
        YiqiaRecentsStore.Instance.on(UPDATE_RECENT_EVENT, this.onListDataUpdate)
    }

    public componentWillUnmount() {
        defaultDispatcher.unregister(this.dispatcherRef);
        RoomListStore.instance.off(LISTS_UPDATE_EVENT, this.onListsOrderUpdated);
        this.tilesRef.current?.removeEventListener("scroll", this.onScrollPrevent);
        YiqiaRecentsStore.Instance.removeListener(UPDATE_RECENT_EVENT, this.onListDataUpdate)
    }

    private onListDataUpdate = () => {
        const stateUpdates: IState & any = {}; // &any is to avoid a cast on the initializer
        const newUsers = arrayFastClone(YiqiaContactUserStore.instance.usersList || []);
        stateUpdates.users = newUsers;
        this.setState(stateUpdates);
    }

    private onListsOrderUpdated = () => {
        const stateUpdates: IState & any = {}; // &any is to avoid a cast on the initializer

        const currentUsers = this.state.users;
        const newUsers = arrayFastClone(YiqiaContactUserStore.instance.usersList || []);
        if (arrayHasOrderChange(currentUsers, newUsers)) {
            stateUpdates.users = newUsers;
        }

        if (Object.keys(stateUpdates).length > 0) {
            this.setState(stateUpdates);
        }
    };

    private onAction = (payload: ActionPayload) => {
    };

    private renderUsers(): React.ReactElement[] {
        console.log("renderUsers and users is ", this.state.users)
        const tiles: React.ReactElement[] = [];

        if (this.state.users) {
            let allUsers = this.state.users;

            for (const user of allUsers) {
                tiles.push(
                    <YiqiaUserItem userItem={user}></YiqiaUserItem>
                );
            }
        }

        return tiles;
    }

    private onScrollPrevent(e: Event) {
        // the RoomTile calls scrollIntoView and the browser may scroll a div we do not wish to be scrollable
        // this fixes https://github.com/vector-im/element-web/issues/14413
        (e.target as HTMLDivElement).scrollTop = 0;
    }

    public render(): React.ReactElement {
        const visibleUsers = this.renderUsers();
        const classes = classNames({
            'yiqia_ContactUserList': true,
        });

        let content = null;
        if (visibleUsers.length > 0) {
            content = (
                <div className="yiqia_ContactUserList_tiles" ref={this.tilesRef}>
                    { visibleUsers }
                </div>
            );
        } else if (this.props.showSkeleton) {
            content = <div className="yiqia_ContactUserList_skeletonUI" />;
        }

        return (
            <div
                ref={this.sublistRef}
                className={classes}
                role="group"
            >
                { content }
            </div>
        );
    }
}
