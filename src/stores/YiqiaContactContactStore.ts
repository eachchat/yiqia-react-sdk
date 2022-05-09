import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { GmsContact, UserModal } from "../models/YiqiaModels";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { AsyncStoreWithClient } from "./AsyncStoreWithClient";

export class YiqiaContactContactStore extends AsyncStoreWithClient<IState> {
    private _contactsInGms:UserModal[] = [];
    public static YiqiaContactContactStoreInstance = new YiqiaContactContactStore();

    constructor() {
        super(defaultDispatcher)
    }

    public static get Instance() {
        return YiqiaContactContactStore.YiqiaContactContactStoreInstance;
    }

    public get gmsContacts() {
        return this._contactsInGms;
    }
    
    protected onAction(payload: ActionPayload): Promise<void> {
        return;
    }

    /**
     *  contactCompany: ""
        contactEmail: ""
        contactId: "18"
        contactMatrixId: "@chengfang:workly.ai"
        contactMobile: ""
        contactRemarkName: "程方正式"
        contactTelephone: ""
        contactTitle: ""
        contactType: 1
        created: "2021-06-07T09:48:58.000+0000"
        del: 0
        lastModified: null
        matrixId: "@wangxin:staging.eachchat.net"
        updateTimestamp: "1623059338183"
        userId: "00520195329223DY4qsA"
        valid: 1
     */
    protected async generalContactsList(): Promise<void> {
        const results = await YiqiaContact.Instance.yiqiaContactContacts();
        const showResults = results.map((gmsContact: GmsContact) => {
            const usermodal = new UserModal(gmsContact.matrixId, gmsContact.contactRemarkName);
            usermodal.updateFromGmsContact(gmsContact);
            return usermodal;
        })
        console.log("showResults is ", showResults);
        this._contactsInGms = showResults;
    }

    protected async onReady() {
        this.generalContactsList();
    }

}