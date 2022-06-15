/*
Copyright 2020, 2021 The Matrix.org Foundation C.I.C.

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
import { createRef, RefObject } from "react";
import classNames from "classnames";

import defaultDispatcher from "../../dispatcher/dispatcher";
import { _t } from "../../languageHandler";
import { ActionPayload } from "../../dispatcher/payloads";
import AccessibleButton from "../views/elements/AccessibleButton";
import { Action } from "../../dispatcher/actions";
import RoomListStore from "../../stores/room-list/RoomListStore";
import { NameFilterCondition } from "../../stores/room-list/filters/NameFilterCondition";
import { getKeyBindingsManager } from "../../KeyBindingsManager";
import { replaceableComponent } from "../../utils/replaceableComponent";
import { isMac, Key } from "../../Keyboard";
import { ALTERNATE_KEY_NAME, KeyBindingAction } from "../../accessibility/KeyboardShortcuts";
import YiqiaContactUserStore, { UPDATE_SELECTED_CONTACT_ITEM } from "../../stores/YiqiaContactUserStore";

interface IProps {
    /**
     * @returns true if a room has been selected and the search field should be cleared
     */
    onSelectUser(): boolean;
    onSearch(): string;
    onInputChange(term:string);
}

interface IState {
    query: string;
    focused: boolean;
}

@replaceableComponent("structures.YiqiaContactUserSearch")
export default class YiqiaContactUserSearch extends React.PureComponent<IProps, IState> {
    private readonly dispatcherRef: string;
    private elementRef: React.RefObject<HTMLInputElement | HTMLDivElement> = createRef();
    private searchFilter: NameFilterCondition = new NameFilterCondition();

    constructor(props: IProps) {
        super(props);

        this.state = {
            query: "",
            focused: false,
        };

        this.dispatcherRef = defaultDispatcher.register(this.onAction);
        // clear filter when changing spaces, in future we may wish to maintain a filter per-space
        YiqiaContactUserStore.instance.on(UPDATE_SELECTED_CONTACT_ITEM, this.clearInput);
    }

    public componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>): void {
        // if (prevState.query !== this.state.query) {
        //     const hadSearch = !!this.searchFilter.search.trim();
        //     const haveSearch = !!this.state.query.trim();
        //     this.searchFilter.search = this.state.query;
        //     if (!hadSearch && haveSearch) {
        //         // started a new filter - add the condition
        //         RoomListStore.instance.addFilter(this.searchFilter);
        //     } else if (hadSearch && !haveSearch) {
        //         // cleared a filter - remove the condition
        //         RoomListStore.instance.removeFilter(this.searchFilter);
        //     } // else the filter hasn't changed enough for us to care here
        // }
    }

    public componentWillUnmount() {
        defaultDispatcher.unregister(this.dispatcherRef);
        YiqiaContactUserStore.instance.off(UPDATE_SELECTED_CONTACT_ITEM, this.clearInput);
    }

    private onAction = (payload: ActionPayload) => {
        if (payload.action === Action.ViewRoom && payload.clear_search) {
            this.clearInput();
        } else if (payload.action === 'focus_room_filter') {
            this.focus();
        }
    };

    private clearInput = () => {
        if (this.elementRef.current?.tagName !== "INPUT") return;
        (this.elementRef.current as HTMLInputElement).value = "";
        this.onChange();
    };

    private onChange = () => {
        if (this.elementRef.current?.tagName !== "INPUT") return;
        const value = (this.elementRef.current as HTMLInputElement).value;
        this.setState({ query: (this.elementRef.current as HTMLInputElement).value });
        this.props.onInputChange(value);
    };

    private onFocus = (ev: React.FocusEvent<HTMLInputElement>) => {
        this.setState({ focused: true });
        ev.target.select();
    };

    private onBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
        this.setState({ focused: false });
    };

    private onKeyDown = (ev: React.KeyboardEvent) => {
        const action = getKeyBindingsManager().getRoomListAction(ev);
        switch (action) {
            case KeyBindingAction.ClearRoomFilter:
                this.clearInput();
                defaultDispatcher.fire(Action.FocusSendMessageComposer);
                break;
            case KeyBindingAction.SelectRoomInRoomList: {
                const shouldClear = this.props.onSelectUser();
                if (shouldClear) {
                    // wrap in set immediate to delay it so that we don't clear the filter & then change room
                    setImmediate(() => {
                        this.clearInput();
                    });
                }
                break;
            }
        }
    };

    public focus = (): void => {
        this.elementRef.current?.focus();
    };

    public render(): React.ReactNode {
        const classes = classNames({
            'yiqia_ContactUserSearch': true,
            'yiqia_ContactUserSearch_hasQuery': this.state.query,
            'yiqia_ContactUserSearch_focused': this.state.focused,
        });


        const inputClasses = classNames({
            'yiqia_ContactUserSearch_input': true,
            'yiqia_ContactUserSearch_inputExpanded': this.state.query || this.state.focused,
        });

        const icon = (
            <div className="yiqia_ContactUserSearch_icon" />
        );

        let input = (
            <input
                type="text"
                ref={this.elementRef as RefObject<HTMLInputElement>}
                className={inputClasses}
                value={this.state.query}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
                onChange={this.onChange}
                onKeyDown={this.onKeyDown}
                placeholder={_t("Search")}
                autoComplete="off"
            />
        );

        return (
            <div className={classes} onClick={this.focus}>
                { icon }
                { input }
                <AccessibleButton
                    tabIndex={-1}
                    title={_t("Clear filter")}
                    className="yiqia_ContactUserSearch_clearButton"
                    onClick={this.clearInput}
                />
            </div>
        );
    }

    public appendChar(char: string): void {
        this.setState({
            query: this.state.query + char,
        });
    }

    public backspace(): void {
        this.setState({
            query: this.state.query.substring(0, this.state.query.length - 1),
        });
    }
}
