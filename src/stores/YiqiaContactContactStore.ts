import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { GmsContact, UserModal } from "../models/YiqiaModels";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { YiqiaBaseUserStore } from "./YiqiaBaseUserStore";

export class YiqiaContactContactStore extends YiqiaBaseUserStore<IState> {
    private _contactsInGms: Map<string, UserModal[]> = new Map();
    public static YiqiaContactContactStoreInstance = new YiqiaContactContactStore();

    constructor() {
        super(defaultDispatcher)
    }

    public static get Instance() {
        return YiqiaContactContactStore.YiqiaContactContactStoreInstance;
    }

    public get gmsContacts():Map<string, UserModal[]> {
        return this._contactsInGms;
    }
    
    protected onAction(payload: ActionPayload): Promise<void> {
        return;
    }

    protected async generalContactsList(): Promise<void> {
        const results = await YiqiaContact.Instance.yiqiaContactContacts();
        const showResults = results.map((gmsContact: GmsContact) => {
            const usermodal = new UserModal(gmsContact.matrixId, gmsContact.contactRemarkName);
            usermodal.updateFromGmsContact(gmsContact);
            return usermodal;
        })
        this._contactsInGms = this.dataDeal(showResults);
    }

    protected async onReady() {
        this.generalContactsList();
    }

}