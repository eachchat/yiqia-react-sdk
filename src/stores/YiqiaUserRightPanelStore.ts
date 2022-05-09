import defaultDispatcher from '../dispatcher/dispatcher';
import { ActionPayload } from '../dispatcher/payloads';
import { UserModal } from '../models/YiqiaModels';
import { UPDATE_EVENT } from './AsyncStore';
import { ReadyWatchingStore } from './ReadyWatchingStore';

export default class YiqiaUserRightPanelStore extends ReadyWatchingStore {
    public static YiqiaUserRightPanelStoreInstance;
    private isReady = false;
    private _curUser: UserModal;
    private readonly dispatcherRefYiqiaUserRightPanelStore: string;
    constructor() {
        super(defaultDispatcher)
        this.dispatcherRefYiqiaUserRightPanelStore = defaultDispatcher.register(this.onDispatch);
    }

    protected async onReady(): Promise<any> {
        this.isReady = true;
    }
    public destroy() {
        if (this.dispatcherRefYiqiaUserRightPanelStore) {
            defaultDispatcher.unregister(this.dispatcherRefYiqiaUserRightPanelStore);
        }
        super.destroy();
    }

    protected get curUser() {
        return this._curUser;
    }

    public setCurd(user: UserModal) {
        this._curUser = user;
        this.emitAndUpdateCard();
    }

    private onDispatch = (payload: ActionPayload) => {
        switch (payload.action) {
            // case 'view_group': {
            //     // Put group in the same/similar view to what was open from the previously viewed room
            //     // Is contradictory to the new "per room" philosophy but it is the legacy behavior for groups.

            //     if (
            //         this.currentCard?.phase === RightPanelPhases.GroupMemberInfo
            //     ) {
            //         // switch from room to group
            //         this.setRightPanelCache({ phase: RightPanelPhases.GroupMemberList, state: {} });
            //     }

            //     // The right panel store always will return the state for the current room.
            //     this.viewedRoomId = null; // a group is not a room
            //     // load values from byRoomCache with the viewedRoomId.
            //     if (this.isReady) {
            //         // we need the client to be ready to get the events form the ids of the settings
            //         // the loading will be done in the onReady function (to catch up with the changes done here before it was ready)
            //         // all the logic in this case is not necessary anymore as soon as groups are dropped and we use: onRoomViewStoreUpdate
            //         this.loadCacheFromSettings();

            //         // DO NOT EMIT. Emitting breaks iframe refs by triggering a render
            //         // for the room view and calling the iframe ref changed function
            //         // this.emitAndUpdateSettings();
            //     }
            //     break;
            // }
        }
    };

    private emitAndUpdateCard() {
        this.emit(UPDATE_EVENT, null);
    }

    public static get Instance() {
        if(!YiqiaUserRightPanelStore.YiqiaUserRightPanelStoreInstance) {
            YiqiaUserRightPanelStore.YiqiaUserRightPanelStoreInstance = new YiqiaUserRightPanelStore();
        }
        return YiqiaUserRightPanelStore.YiqiaUserRightPanelStoreInstance;
    }
}