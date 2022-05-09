import { AsyncStoreWithClient } from "./AsyncStoreWithClient";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { UserModal, DepartmentModal, ContactTagId } from "../models/YiqiaModels";
import YiqiaRecentsStore from "./YiqiaRecentsStore";
import { YiqiaContactContactStore } from "./YiqiaContactContactStore";
// import { getContact } from "../YiqiaUtils";

interface IState {}

export const UPDATE_SELECTED_CONTACT_ITEM = Symbol("selected_contact_item");

export default class YiqiaContactUserStore extends AsyncStoreWithClient<IState> {
    private static internalInstance = new YiqiaContactUserStore();
    private _curUsersList: UserModal[] = [];
    private _curItem: ContactTagId = ContactTagId.Recent;

    constructor() {
        super(defaultDispatcher);
    }

    protected async onAction(payload: ActionPayload): Promise<void> {
        // nothing
    }

    public static get instance(): YiqiaContactUserStore {
        return YiqiaContactUserStore.internalInstance;
    }

    public get curItem(): ContactTagId {
        return this._curItem;
    }

    public setCurItem(item: ContactTagId) {
        console.log("setCurItem")
        this._curItem = item;
        this.updateUsers();
        this.emit(UPDATE_SELECTED_CONTACT_ITEM);
    }

    protected updateUsers() {
        switch(this._curItem) {
            case ContactTagId.Recent:
                this.updateUsersListFromRecentData();
                break;
            case ContactTagId.Contact:
                this.updateUsersListFromContactsData();
                break;
            case ContactTagId.Organization:
                break;
            case ContactTagId.Teams:
                break;
        }
    }

    private updateUsersListFromRecentData() {
        // this._curUsersList = BreadcrumbsStore.instance.dms.slice();
        this._curUsersList = YiqiaRecentsStore.Instance.recents;
        console.log("updateUsersListFromRecentData ", this._curUsersList);
    }

    private updateUsersListFromContactsData() {
        this._curUsersList = YiqiaContactContactStore.Instance.gmsContacts;
        console.log("updateUsersListFromContactsData ", this._curUsersList);
    }

    protected async onReady(): Promise<void> {
        this.updateUsers();
    }

    public get usersList():  UserModal[]{
        return this._curUsersList;
    }

    // public getRoomDepartment(): Promise<DepartmentModal> {
    //     return new Promise((resolve, reject) => {
    //         getContact().then(ret => {
    //             console.log("ret is ", ret);
    //         })
    //     })
    // }
}