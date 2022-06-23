import { IRoomTimelineData } from "matrix-js-sdk/src/models/event-timeline-set";
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import { Room, RoomEvent } from "matrix-js-sdk/src/models/room";
import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { UserModal, YIQIA_LOADING } from "../models/YiqiaModels";
import DMRoomMap from "../utils/DMRoomMap";
import { DefaultTagID } from "./room-list/models";
import RoomListStore from "./room-list/RoomListStore";
import SettingsStore from "../settings/SettingsStore";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { YiqiaBaseUserStore } from "./YiqiaBaseUserStore";

export const UPDATE_RECENT_EVENT = Symbol("yiqia_recent_user_update");

export default class YiqiaRecentsStore extends YiqiaBaseUserStore<IState> {
    private _recentsList: Map<string, UserModal[]> = new Map();
    private _isUpdating: boolean = false;
    private _allUsers: UserModal[] = [];
    public static YiqiaRecentsStoreInstance = new YiqiaRecentsStore();
    constructor() {
        super(defaultDispatcher);
        this.onRoomTimeline = this.onRoomTimeline.bind(this);
    }

    public isUserInContact(user:UserModal) {
        let res = false;
        for(const conatct of this._allUsers) {
            if(user.matrixId === conatct?.matrixId) {
                res = true;
                break;
            }
        }
        return res;
    }

    public static get Instance(): YiqiaRecentsStore {
        return YiqiaRecentsStore.YiqiaRecentsStoreInstance;
    }

    public get recents(): UserModal[] {
        if(this._allUsers.length === 0) {
            this.generalSortedDMList();
        }
        return this._allUsers;
    }

    protected async onAction(payload: ActionPayload): Promise<void> {
        
    }

    public async updateItemFromGms(item: UserModal): Promise<UserModal> {
        try{
            const userInfo = await YiqiaContact.Instance.yiqiaGmsInfoFromMatrixId(item.matrixId);
            if(userInfo) {
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
        let newData = new Map<string, UserModal[]>();
        let newUsers = [];
        this._isUpdating = true;
        let needUpdate = false;
        for(let i = 0; i < this._allUsers.length; i++) {
            const user = this._allUsers[i];
            if(user.OrganizationInfo === YIQIA_LOADING) {
                const gmsUserInfo = await this.updateItemFromGms(user);
                if(gmsUserInfo) {
                    if(user.updateProperty(gmsUserInfo)) {
                        needUpdate = true;
                    }
                }
            }
            newUsers.push(user);
        }
        this._isUpdating = false;
        this._allUsers = newUsers;
        if(needUpdate) {
            this.emit(UPDATE_RECENT_EVENT);
        }
    }

    public generalSortedDMList(): void {
        let allRooms = [];
        let availUids = [];
        if(SettingsStore.getValue("mixedChatsWithDmAndRoom")) {
            allRooms = RoomListStore.instance.orderedLists[DefaultTagID.Chats]
        } else {
            allRooms = RoomListStore.instance.orderedLists[DefaultTagID.DM];
        }
        if(!allRooms || allRooms.length == 0) return;
        const DMMap = DMRoomMap.shared();
        let improvedList = allRooms.map((room:Room) => {
            const curUid = DMMap.getUserIdForRoomId(room.roomId);
            const matrixUser = this.matrixClient.getUser(curUid)
            if(matrixUser) {
                const usermodal = new UserModal(matrixUser.userId, matrixUser.displayName, matrixUser.avatarUrl);
                usermodal.Room = room;
                usermodal.sortTime = room.timeline[room.timeline.length - 1].getTs();
                return usermodal;
            }
        }).filter(userItem => {
            if(!userItem) return false;
            if(availUids.indexOf(userItem.matrixId) >= 0) {
                return false;
            }
            availUids.push(userItem.matrixId)
            return !!userItem;
        })
        improvedList.sort((a, b) => {
            return a.sortTime <= b.sortTime ? 1 : -1;
        });
        this._allUsers = improvedList;
        this._recentsList = this.dataDeal(improvedList);
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