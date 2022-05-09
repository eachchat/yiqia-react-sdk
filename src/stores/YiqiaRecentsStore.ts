import { IRoomTimelineData } from "matrix-js-sdk/src/models/event-timeline-set";
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import { Room, RoomEvent } from "matrix-js-sdk/src/models/room";
import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { UserModal, YIQIA_LOADING } from "../models/YiqiaModels";
import DMRoomMap from "../utils/DMRoomMap";
import { AsyncStoreWithClient } from "./AsyncStoreWithClient";
import { DefaultTagID } from "./room-list/models";
import RoomListStore from "./room-list/RoomListStore";
import SettingsStore from "../settings/SettingsStore";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";

export const UPDATE_RECENT_EVENT = Symbol("yiqia_recent_user_update");

export default class YiqiaRecentsStore extends AsyncStoreWithClient<IState> {
    private _recentsList: UserModal[] = [];
    private _isUpdating: boolean = false;
    public static YiqiaRecentsStoreInstance = new YiqiaRecentsStore();
    constructor() {
        super(defaultDispatcher);
        this.onRoomTimeline = this.onRoomTimeline.bind(this);
    }

    public static get Instance(): YiqiaRecentsStore {
        return YiqiaRecentsStore.YiqiaRecentsStoreInstance;
    }

    public get recents(): UserModal[] {
        if(this._recentsList.length === 0) {
            this.generalSortedDMList();
        }
        return this._recentsList || [];
    }

    protected async onAction(payload: ActionPayload): Promise<void> {
        
    }

    private async updateItemFromGms(item: UserModal): Promise<UserModal> {
        try{
            const userInfo = await YiqiaContact.Instance.yiqiaGmsInfoFromMatrixId(item.matrixId);
            if(userInfo) {
                console.log("========= user ", userInfo);
                return userInfo;
            }
            return null;
        }
        catch(error) {
            return null;
        }

    }

    private async selfUpdateFromGms(): Promise<void> {
        if(this._isUpdating) return;
        this._isUpdating = true;
        let needUpdate = false;
        for(let item of this._recentsList) {
            if(item.OrganizationInfo === YIQIA_LOADING) {
                const gmsUserInfo = await this.updateItemFromGms(item);
                if(gmsUserInfo) {
                    if(item.updateProperty(gmsUserInfo)) {
                        needUpdate = true;
                    }
                }
            }
        }
        console.log("--------- recent list ", this._recentsList);
        this._isUpdating = false;
        if(needUpdate) {
            this.emit(UPDATE_RECENT_EVENT);
        }
    }

    private generalSortedDMList(): void {
        let allRooms = [];
        if(SettingsStore.getValue("mixedChatsWithDmAndRoom")) {
            allRooms = RoomListStore.instance.orderedLists[DefaultTagID.Chats]
        } else {
            allRooms = RoomListStore.instance.orderedLists[DefaultTagID.DM];
        }
        if(!allRooms || allRooms.length == 0) return;
        const DMMap = DMRoomMap.shared();
        this._recentsList = allRooms.sort((a, b) => {
            return a.timeline[a.timeline.length - 1].getTs() - b.timeline[b.timeline.length - 1].getTs();
        }).map((room:Room) => {
            const curUid = DMMap.getUserIdForRoomId(room.roomId);
            const matrixUser = this.matrixClient.getUser(curUid)
            if(matrixUser) {
                const usermodal = new UserModal(matrixUser.userId, matrixUser.displayName, matrixUser.avatarUrl);
                usermodal.Room = room;
                return usermodal;
            }
        }).filter(userItem => {
            return !!userItem;
        })
        this.selfUpdateFromGms();
    }

    private onRoomTimeline = async (
        ev: MatrixEvent,
        room: Room | null,
        toStartOfTimeline: boolean,
        removed: boolean,
        data: IRoomTimelineData,
    ) => {
        if (!room) return; // notification timeline, we'll get this event again with a room specific timeline

        // If it isn't a live event or if it's redacted there's nothing to do.
        if (!data || !data.liveEvent) {
            return;
        }

        if(!DMRoomMap.shared().getUserIdForRoomId(room.roomId)) {
            return;
        }

        this.generalSortedDMList();
    }

    protected async onReady() {
        if (this.matrixClient) {
            this.matrixClient.on(RoomEvent.Timeline, this.onRoomTimeline);
        }
        await this.generalSortedDMList();
    }

    protected async onNotReady() {
        if (this.matrixClient) {
            this.matrixClient.removeListener(RoomEvent.Timeline, this.onRoomTimeline);
        }
    }

}