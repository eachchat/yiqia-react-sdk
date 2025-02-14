/*
Copyright 2019-2022 The Matrix.org Foundation C.I.C.

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

import { EventSubscription } from 'fbemitter';
import { logger } from "matrix-js-sdk/src/logger";
import { CryptoEvent } from "matrix-js-sdk/src/crypto";

import defaultDispatcher from '../../dispatcher/dispatcher';
import { pendingVerificationRequestForUser } from '../../verification';
import SettingsStore from "../../settings/SettingsStore";
import { RightPanelPhases } from "./RightPanelStorePhases";
import { ActionPayload } from "../../dispatcher/payloads";
import { SettingLevel } from "../../settings/SettingLevel";
import { UPDATE_EVENT } from '../AsyncStore';
import { ReadyWatchingStore } from '../ReadyWatchingStore';
import {
    convertToStatePanel,
    convertToStorePanel,
    IRightPanelCard,
    IRightPanelForRoom,
} from './RightPanelStoreIPanelState';
import RoomViewStore from '../RoomViewStore';
import { YiqiaContact } from '../../utils/yiqiaUtils/YiqiaContact';
import { AuthApi } from '../../utils/yiqiaUtils/YiqiaRequestInterface';

const GROUP_PHASES = [
    RightPanelPhases.GroupMemberList,
    RightPanelPhases.GroupRoomList,
    RightPanelPhases.GroupRoomInfo,
    RightPanelPhases.GroupMemberInfo,
];

/**
 * {aId: 1, appName: "邮箱助手", appMatrixId: "@mailbot:yiqia.com", appEnv: 2,…}
aId: 1
appEnv: 2
appMatrixId: "@mailbot:yiqia.com"
appName: "邮箱助手"
createdBy: null
description: "邮箱助手将为您推送新邮件，以免您遗漏重要通知"
developer: "爱工作"
help: "<b font-size=\"16px\">授权登录邮箱</b>\r\n<div font-size=\"14px\">在群聊中发送 <font color=\"#00c975\">!mail login</font> 以完成邮箱的登录并开始接受邮件提醒。</div>\r\n<br>\r\n<b font-size=\"16px\">移除邮箱</b>\r\n<div font-size=\"14px\">在群聊中发送 <font color=\"#00c975\">!mail logout</font> 以解除当前群聊的邮箱。</div>\r\n<br>\r\n<b font-size=\"16px\">查看邮件接收箱列表</b>\r\n<div font-size=\"14px\">在群聊中发送 <font color=\"#00c975\">!mail mailboxes</font> 以查看当前群聊的邮件接收箱列表。</div>\r\n<br>\r\n<b font-size=\"16px\">变更邮件接收箱</b>\r\n<div font-size=\"14px\">在群聊中发送 <font color=\"#00c975\">!mail setmailbox [mailbox name]</font> 以变更邮件接收箱的推送。</div>\r\n<br>\r\n<b font-size=\"16px\">移除邮箱助手</b>\r\n<div font-size=\"14px\">在群聊中发送 <font color=\"#00c975\">!mail leave</font> 以移除邮箱助手。</div>\r\n<br>\r\n<b font-size=\"16px\">帮助</b>\r\n<div font-size=\"14px\">在群聊中发送 <font color=\"#00c975\">!mail help</font> 以获得更多操作帮助。</div>"
lastModifiedBy: null
logoUrl: "/upload/app_logo/test.jpg"
 */

interface botInfo {
    aId: number;
    appEnv: number;
    appMatrixId: string;
    appName: string;
    createdBy: null;
    description: string;
    developer: string;
    help: string;
    lastModifiedBy: null;
    logoUrl: string;
}

/**
 * A class for tracking the state of the right panel between layouts and
 * sessions. This state includes a history for each room. Each history element
 * contains the phase (e.g. RightPanelPhase.RoomMemberInfo) and the state (e.g.
 * the member) associated with it.
 * Groups are treated the same as rooms (they are also stored in the byRoom
 * object). This is possible since the store keeps track of the opened
 * room/group -> the store will provide the correct history for that group/room.
*/
export default class RightPanelStore extends ReadyWatchingStore {
    private static internalInstance: RightPanelStore;
    private readonly dispatcherRefRightPanelStore: string;
    private viewedRoomId: string;
    private isReady = false;
    private botsInfos:Map<string, botInfo> = new Map();

    private global?: IRightPanelForRoom = null;
    private byRoom: {
        [roomId: string]: IRightPanelForRoom;
    } = {};

    private roomStoreToken: EventSubscription;

    private constructor() {
        super(defaultDispatcher);
        this.dispatcherRefRightPanelStore = defaultDispatcher.register(this.onDispatch);
    }

    private getBotServerList() {
        AuthApi.Instance.getBotServerList()
            .then((resp) => {
                console.log("====getBotServerList resp ", resp);
                if(resp.results) {
                    resp.results.forEach(item => {
                        this.botsInfos.set(item.appMatrixId, item);
                    })
                }
            }).catch(err => {
                console.log("======== getBotServerList error ", err);
            })
    }

    public getBotInfo(matrixId) {
        return this.botsInfos.get(matrixId);
    }

    private getDistBotInfo(distMatrixId) {
        AuthApi.Instance.getDistBotInfo(distMatrixId)
            .then((resp) => {
                console.log("====resp ", resp);
            })
    }

    protected async onReady(): Promise<any> {
        this.isReady = true;
        this.roomStoreToken = RoomViewStore.addListener(this.onRoomViewStoreUpdate);
        this.matrixClient.on(CryptoEvent.VerificationRequest, this.onVerificationRequestUpdate);
        this.viewedRoomId = RoomViewStore.getRoomId();
        this.loadCacheFromSettings();
        this.emitAndUpdateSettings();
        this.getBotServerList();
    }
    public destroy() {
        if (this.dispatcherRefRightPanelStore) {
            defaultDispatcher.unregister(this.dispatcherRefRightPanelStore);
        }
        super.destroy();
    }

    protected async onNotReady(): Promise<any> {
        this.isReady = false;
        this.matrixClient.off(CryptoEvent.VerificationRequest, this.onVerificationRequestUpdate);
        this.roomStoreToken.remove();
    }

    // Getters
    /**
     * If you are calling this from a component that already knows about a
     * specific room from props / state, then it's best to prefer
     * `isOpenForRoom` below to ensure all your data is for a single room
     * during room changes.
     */
    public get isOpen(): boolean {
        return this.byRoom[this.viewedRoomId]?.isOpen ?? false;
    }

    public isOpenForRoom(roomId: string): boolean {
        return this.byRoom[roomId]?.isOpen ?? false;
    }

    public get roomPhaseHistory(): Array<IRightPanelCard> {
        return this.byRoom[this.viewedRoomId]?.history ?? [];
    }

    /**
     * If you are calling this from a component that already knows about a
     * specific room from props / state, then it's best to prefer
     * `currentCardForRoom` below to ensure all your data is for a single room
     * during room changes.
     */
    public get currentCard(): IRightPanelCard {
        const hist = this.roomPhaseHistory;
        if (hist.length >= 1) {
            return hist[hist.length - 1];
        }
        return { state: {}, phase: null };
    }

    public currentCardForRoom(roomId: string): IRightPanelCard {
        const hist = this.byRoom[roomId]?.history ?? [];
        if (hist.length > 0) {
            return hist[hist.length - 1];
        }
        return { state: {}, phase: null };
    }

    public get previousCard(): IRightPanelCard {
        const hist = this.roomPhaseHistory;
        if (hist?.length >= 2) {
            return hist[hist.length - 2];
        }
        return { state: {}, phase: null };
    }

    // The Group associated getters are just for backwards compatibility. Can be removed when deprecating groups.
    public get isOpenForGroup(): boolean { return this.isOpen; }
    public get groupPhaseHistory(): Array<IRightPanelCard> { return this.roomPhaseHistory; }
    public get currentGroup(): IRightPanelCard { return this.currentCard; }
    public get previousGroup(): IRightPanelCard { return this.previousCard; }

    // Setters
    public setCard(card: IRightPanelCard, allowClose = true, roomId?: string) {
        const rId = roomId ?? this.viewedRoomId;
        // This function behaves as following:
        // Update state: if the same phase is send but with a state
        // Set right panel and erase history: if a "different to the current" phase is send (with or without a state)
        // If the right panel is set, this function also shows the right panel.
        const redirect = this.getVerificationRedirect(card);
        const targetPhase = redirect?.phase ?? card.phase;
        const cardState = redirect?.state ?? (Object.keys(card.state ?? {}).length === 0 ? null : card.state);

        // Checks for wrong SetRightPanelPhase requests
        if (!this.isPhaseValid(targetPhase)) return;

        if ((targetPhase === this.currentCardForRoom(rId)?.phase && !!cardState)) {
            // Update state: set right panel with a new state but keep the phase (don't know it this is ever needed...)
            const hist = this.byRoom[rId]?.history ?? [];
            hist[hist.length - 1].state = cardState;
            this.emitAndUpdateSettings();
            return;
        } else if (targetPhase !== this.currentCard?.phase) {
            // Set right panel and erase history.
            this.show();
            this.setRightPanelCache({ phase: targetPhase, state: cardState ?? {} }, rId);
        } else {
            this.show();
            this.emitAndUpdateSettings();
        }
    }

    public setCards(cards: IRightPanelCard[], allowClose = true, roomId: string = null) {
        // This function sets the history of the right panel and shows the right panel if not already visible.
        const rId = roomId ?? this.viewedRoomId;
        const history = cards.map(c => ({ phase: c.phase, state: c.state ?? {} }));
        this.byRoom[rId] = { history, isOpen: true };
        this.show();
        this.emitAndUpdateSettings();
    }

    public pushCard(
        card: IRightPanelCard,
        allowClose = true,
        roomId: string = null,
    ) {
        // This function appends a card to the history and shows the right panel if now already visible.
        const rId = roomId ?? this.viewedRoomId;
        const redirect = this.getVerificationRedirect(card);
        const targetPhase = redirect?.phase ?? card.phase;
        const pState = redirect?.state ?? (Object.keys(card.state ?? {}).length === 0 ? null : card.state);

        // Checks for wrong SetRightPanelPhase requests
        if (!this.isPhaseValid(targetPhase)) return;

        const roomCache = this.byRoom[rId];
        if (!!roomCache) {
            // append new phase
            roomCache.history.push({ state: pState, phase: targetPhase });
            roomCache.isOpen = allowClose ? roomCache.isOpen : true;
        } else {
            // setup room panel cache with the new card
            this.byRoom[rId] = {
                history: [{ phase: targetPhase, state: pState ?? {} }],
                // if there was no right panel store object the the panel was closed -> keep it closed, except if allowClose==false
                isOpen: !allowClose,
            };
        }
        this.show();
        this.emitAndUpdateSettings();
    }

    public popCard(roomId: string = null) {
        const rId = roomId ?? this.viewedRoomId;
        if (!this.byRoom[rId]) return;

        const removedCard = this.byRoom[rId].history.pop();
        this.emitAndUpdateSettings();
        return removedCard;
    }

    public togglePanel(roomId: string = null) {
        const rId = roomId ?? this.viewedRoomId;
        if (!this.byRoom[rId]) return;

        this.byRoom[rId].isOpen = !this.byRoom[rId].isOpen;
        this.emitAndUpdateSettings();
    }

    public show() {
        if (!this.isOpen) {
            this.togglePanel();
        }
    }

    public hide() {
        if (this.isOpen) {
            this.togglePanel();
        }
    }

    private loadCacheFromSettings() {
        const room = this.viewedRoomId && this.mxClient?.getRoom(this.viewedRoomId);
        if (!!room) {
            this.global = this.global ??
                convertToStatePanel(SettingsStore.getValue("RightPanel.phasesGlobal"), room);
            this.byRoom[this.viewedRoomId] = this.byRoom[this.viewedRoomId] ??
                convertToStatePanel(SettingsStore.getValue("RightPanel.phases", this.viewedRoomId), room);
        } else {
            console.warn("Could not restore the right panel after load because there was no associated room object. " +
                "The right panel can only be restored for rooms and spaces but not for groups.");
        }
    }

    private emitAndUpdateSettings() {
        this.filterValidCards(this.global);
        const storePanelGlobal = convertToStorePanel(this.global);
        SettingsStore.setValue("RightPanel.phasesGlobal", null, SettingLevel.DEVICE, storePanelGlobal);

        if (!!this.viewedRoomId) {
            const panelThisRoom = this.byRoom[this.viewedRoomId];
            this.filterValidCards(panelThisRoom);
            const storePanelThisRoom = convertToStorePanel(panelThisRoom);
            SettingsStore.setValue(
                "RightPanel.phases",
                this.viewedRoomId,
                SettingLevel.ROOM_DEVICE,
                storePanelThisRoom,
            );
        }
        this.emit(UPDATE_EVENT, null);
    }

    private filterValidCards(rightPanelForRoom?: IRightPanelForRoom) {
        if (!rightPanelForRoom?.history) return;
        rightPanelForRoom.history = rightPanelForRoom.history.filter((card) => this.isCardStateValid(card));
    }

    private isCardStateValid(card: IRightPanelCard) {
        // this function does a sanity check on the card. this is required because
        // some phases require specific state properties that might not be available.
        // This can be caused on if element is reloaded and the tries to reload right panel data from id's stored in the local storage.
        // we store id's of users and matrix events. If are not yet fetched on reload the right panel cannot display them.
        // or potentially other errors.
        // (A nicer fix could be to indicate, that the right panel is loading if there is missing state data and re-emit if the data is available)
        switch (card.phase) {
            case RightPanelPhases.ThreadView:
                if (!card.state.threadHeadEvent) {
                    console.warn("removed card from right panel because of missing threadHeadEvent in card state");
                }
                return !!card.state.threadHeadEvent;
            case RightPanelPhases.RoomMemberInfo:
            case RightPanelPhases.SpaceMemberInfo:
            case RightPanelPhases.EncryptionPanel:
            case RightPanelPhases.GroupMemberInfo:
                if (!card.state.member) {
                    console.warn("removed card from right panel because of missing member in card state");
                }
                return !!card.state.member;
            case RightPanelPhases.Room3pidMemberInfo:
            case RightPanelPhases.Space3pidMemberInfo:
                if (!card.state.memberInfoEvent) {
                    console.warn("removed card from right panel because of missing memberInfoEvent in card state");
                }
                return !!card.state.memberInfoEvent;
            case RightPanelPhases.GroupRoomInfo:
                if (!card.state.groupRoomId) {
                    console.warn("removed card from right panel because of missing groupRoomId in card state");
                }
                return !!card.state.groupRoomId;
            case RightPanelPhases.Widget:
                if (!card.state.widgetId) {
                    console.warn("removed card from right panel because of missing widgetId in card state");
                }
                return !!card.state.widgetId;
        }
        return true;
    }

    private setRightPanelCache(card: IRightPanelCard, roomId?: string) {
        const history = [{ phase: card.phase, state: card.state ?? {} }];
        this.byRoom[roomId ?? this.viewedRoomId] = { history, isOpen: true };
        this.emitAndUpdateSettings();
    }

    private getVerificationRedirect(card: IRightPanelCard): IRightPanelCard {
        if (card.phase === RightPanelPhases.RoomMemberInfo && card.state) {
            // RightPanelPhases.RoomMemberInfo -> needs to be changed to RightPanelPhases.EncryptionPanel if there is a pending verification request
            const { member } = card.state;
            const pendingRequest = pendingVerificationRequestForUser(member);
            if (pendingRequest) {
                return {
                    phase: RightPanelPhases.EncryptionPanel,
                    state: {
                        verificationRequest: pendingRequest,
                        member,
                    },
                };
            }
        }
        return null;
    }

    public isPhaseValid(targetPhase: RightPanelPhases, isViewingRoom = this.isViewingRoom): boolean {
        if (!RightPanelPhases[targetPhase]) {
            logger.warn(`Tried to switch right panel to unknown phase: ${targetPhase}`);
            return false;
        }
        if (GROUP_PHASES.includes(targetPhase) && isViewingRoom) {
            logger.warn(
                `Tried to switch right panel to a group phase: ${targetPhase}, ` +
                `but we are currently not viewing a group`,
            );
            return false;
        } else if (!GROUP_PHASES.includes(targetPhase) && !isViewingRoom) {
            logger.warn(
                `Tried to switch right panel to a room phase: ${targetPhase}, ` +
                `but we are currently not viewing a room`,
            );
            return false;
        }
        return true;
    }

    private onVerificationRequestUpdate = () => {
        if (!this.currentCard?.state) return;
        const { member } = this.currentCard.state;
        if (!member) return;
        const pendingRequest = pendingVerificationRequestForUser(member);
        if (pendingRequest) {
            this.currentCard.state.verificationRequest = pendingRequest;
            this.emitAndUpdateSettings();
        }
    };

    private onRoomViewStoreUpdate = () => {
        // TODO: only use this function instead of the onDispatch (the whole onDispatch can get removed!) as soon groups are removed
        const oldRoomId = this.viewedRoomId;
        this.viewedRoomId = RoomViewStore.getRoomId();
        // load values from byRoomCache with the viewedRoomId.
        this.loadCacheFromSettings();

        // if we're switching to a room, clear out any stale MemberInfo cards
        // in order to fix https://github.com/vector-im/element-web/issues/21487
        if (oldRoomId !== this.viewedRoomId) {
            if (this.currentCard?.phase !== RightPanelPhases.EncryptionPanel) {
                const panel = this.byRoom[this.viewedRoomId];
                if (panel?.history) {
                    panel.history = panel.history.filter(
                        (card) => card.phase != RightPanelPhases.RoomMemberInfo &&
                                  card.phase != RightPanelPhases.Room3pidMemberInfo,
                    );
                }
            }
        }

        // If the right panel stays open mode is used, and the panel was either
        // closed or never shown for that room, then force it open and display
        // the room member list.
        if (
            SettingsStore.getValue("feature_right_panel_default_open") &&
            !this.byRoom[this.viewedRoomId]?.isOpen
        ) {
            const history = [{ phase: RightPanelPhases.RoomMemberList }];
            const room = this.viewedRoomId && this.mxClient?.getRoom(this.viewedRoomId);
            if (!room?.isSpaceRoom()) {
                history.unshift({ phase: RightPanelPhases.RoomSummary });
            }
            this.byRoom[this.viewedRoomId] = {
                isOpen: true,
                history,
            };
        }
        this.emitAndUpdateSettings();
    };

    private get isViewingRoom(): boolean {
        return !!this.viewedRoomId;
    }

    private onDispatch = (payload: ActionPayload) => {
        switch (payload.action) {
            case 'view_group': {
                // Put group in the same/similar view to what was open from the previously viewed room
                // Is contradictory to the new "per room" philosophy but it is the legacy behavior for groups.

                if (
                    this.currentCard?.phase === RightPanelPhases.GroupMemberInfo
                ) {
                    // switch from room to group
                    this.setRightPanelCache({ phase: RightPanelPhases.GroupMemberList, state: {} });
                }

                // The right panel store always will return the state for the current room.
                this.viewedRoomId = null; // a group is not a room
                // load values from byRoomCache with the viewedRoomId.
                if (this.isReady) {
                    // we need the client to be ready to get the events form the ids of the settings
                    // the loading will be done in the onReady function (to catch up with the changes done here before it was ready)
                    // all the logic in this case is not necessary anymore as soon as groups are dropped and we use: onRoomViewStoreUpdate
                    this.loadCacheFromSettings();

                    // DO NOT EMIT. Emitting breaks iframe refs by triggering a render
                    // for the room view and calling the iframe ref changed function
                    // this.emitAndUpdateSettings();
                }
                break;
            }
        }
    };

    public static get instance(): RightPanelStore {
        if (!RightPanelStore.internalInstance) {
            RightPanelStore.internalInstance = new RightPanelStore();
        }
        return RightPanelStore.internalInstance;
    }
}

window.mxRightPanelStore = RightPanelStore.instance;
