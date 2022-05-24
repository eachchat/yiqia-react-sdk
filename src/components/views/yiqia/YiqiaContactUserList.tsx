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
import defaultDispatcher from "../../../dispatcher/dispatcher";
import { ActionPayload } from "../../../dispatcher/payloads";
import { polyfillTouchEvent } from "../../../@types/polyfill";
import { mapHasDiff } from "../../../utils/maps";
import { replaceableComponent } from "../../../utils/replaceableComponent";
import YiqiaUserItem, { DescriptType } from "./YiqiaUserItem";
import { UserModal } from "../../../models/YiqiaModels";

export const HEADER_HEIGHT = 32; // As defined by CSS

// HACK: We really shouldn't have to do this.
polyfillTouchEvent();

export interface IAuxButtonProps {
    tabIndex: number;
    dispatcher?: Dispatcher<ActionPayload>;
}

interface IProps {
    showSkeleton?: boolean;
    users: Map<string, UserModal[]>;
}

interface IState {
    initCollapse?: boolean;
}

@replaceableComponent("views.rooms.YiqiaContactUserList")
export default class YiqiaContactUserList extends React.Component<IProps, IState> {
    private sublistRef = createRef<HTMLDivElement>();
    private tilesRef = createRef<HTMLDivElement>();
    private dispatcherRef: string;

    constructor(props: IProps) {
        super(props);

        this.state = {
            initCollapse: false,
        };
    }

    public shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<IState>): boolean {
        const curUsers = this.props.users;
        const nextUsers = nextProps.users;
        if(mapHasDiff(curUsers, nextUsers)) {
            return true;
        }

        // Finally, nothing happened so no-op the update
        return false;
    }

    public componentDidMount() {
        this.dispatcherRef = defaultDispatcher.register(this.onAction);
        // Using the passive option to not block the main thread
        // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scrolling_performance_with_passive_listeners
        this.tilesRef.current?.addEventListener("scroll", this.onScrollPrevent, { passive: true });
    }

    public componentWillUnmount() {
        defaultDispatcher.unregister(this.dispatcherRef);
        this.tilesRef.current?.removeEventListener("scroll", this.onScrollPrevent);
    }

    private onAction = (payload: ActionPayload) => {
    };

    private renderUsers(): React.ReactElement[] {
        const tiles: React.ReactElement[] = [];

        if (this.props.users) {
            let allLetters = [...this.props.users.keys()];

            for (const letter of allLetters) {
                tiles.push(
                    <React.Fragment>
                        <div>{letter}------------</div>
                        {
                            this.props.users.get(letter).map(item => {
                                return(
                                    <YiqiaUserItem userItem={item} descriptType={DescriptType.Title}></YiqiaUserItem>
                                )
                            })
                        }
                    </React.Fragment>
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
