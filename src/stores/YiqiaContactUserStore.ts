import { AsyncStoreWithClient } from "./AsyncStoreWithClient";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { UserModal, DepartmentModal, ContactTagId } from "../models/YiqiaModels";
import YiqiaRecentsStore, { UPDATE_RECENT_EVENT } from "./YiqiaRecentsStore";
import { YiqiaContactContactStore } from "./YiqiaContactContactStore";
import YiqiaOrganizationStore, { ORGANIZATION_ITEM_CLICKED_EVENT, ORGANIZATION_MEMBER_UPDATE_EVENT } from "./YiqiaOrganizationStore";
import { UPDATE_EVENT } from "./AsyncStore";
// import { getContact } from "../YiqiaUtils";

interface IState {}

export const UPDATE_SELECTED_CONTACT_ITEM = Symbol("selected_contact_item");
export const UPDATE_USERLIST_INFOS = Symbol("userlist_infos_update");

export default class YiqiaContactUserStore extends AsyncStoreWithClient<IState> {
    private static internalInstance = new YiqiaContactUserStore();
    private _curUsersList: UserModal[] = [];
    private _curItem: ContactTagId = ContactTagId.Recent;

    constructor() {
        super(defaultDispatcher);
        YiqiaRecentsStore.Instance.on(UPDATE_RECENT_EVENT, this.updateUsers.bind(this));
        YiqiaOrganizationStore.Instance.on(ORGANIZATION_ITEM_CLICKED_EVENT, this.updateUsers.bind(this));
        YiqiaOrganizationStore.Instance.on(ORGANIZATION_MEMBER_UPDATE_EVENT, this.updateUsers.bind(this));
    }

    protected async onAction(payload: ActionPayload): Promise<void> {
        if(payload.action === "yiqia_organization_item_clicked") {
            this.setCurItem(ContactTagId.Organization);
        }
    }

    public static get instance(): YiqiaContactUserStore {
        return YiqiaContactUserStore.internalInstance;
    }

    public get curItem(): ContactTagId {
        return this._curItem;
    }

    public setCurItem(item: ContactTagId) {
        console.log("==========setCurItem")
        this._curItem = item;
        this.updateUsersData();
        this.emit(UPDATE_SELECTED_CONTACT_ITEM);
    }

    public updateUsers() {
        console.log("===========updateUsers");
        this.updateUsersData();
        this.emit(UPDATE_EVENT);
    }

    protected updateUsersData() {
        switch(this._curItem) {
            case ContactTagId.Recent:
                this.updateUsersListFromRecentData();
                break;
            case ContactTagId.Contact:
                this.updateUsersListFromContactsData();
                break;
            case ContactTagId.Organization:
                this.updateUsersListFromOrganization();
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

    private updateUsersListFromOrganization() {
        this._curUsersList = YiqiaOrganizationStore.Instance.curOrgMembers;
        console.log("updateUsersListFromOrganization ", this._curUsersList);
    }

    protected async onReady(): Promise<void> {
        this.updateUsersData();
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