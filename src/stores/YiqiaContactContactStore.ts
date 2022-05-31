import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { GmsContact, UserModal } from "../models/YiqiaModels";
import { objectHasDiff } from "../utils/objects";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { YiqiaBaseUserStore } from "./YiqiaBaseUserStore";

export class YiqiaContactContactStore extends YiqiaBaseUserStore<IState> {
    private _contactsInGms: Map<string, UserModal[]> = new Map();
    private _allUsers: UserModal[];
    public static YiqiaContactContactStoreInstance = new YiqiaContactContactStore();

    constructor() {
        super(defaultDispatcher)
    }

    public isUserInContact(user:UserModal) {
        let res = false;
        for(const conatct of this._allUsers) {
            if(user.matrixId === conatct.matrixId) {
                res = true;
                break;
            }
        }
        return res;
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

    public async generalContactsList(): Promise<void> {
        const results = await YiqiaContact.Instance.yiqiaContactContacts();
        const showResults = results.map((gmsContact: UserModal) => {
            const usermodal = new UserModal(gmsContact.matrixId, gmsContact.nickName, gmsContact.photoUrl, gmsContact.lastName);
            usermodal.updateProperty(gmsContact);
            return usermodal;
        })
        console.log("generalContactsList ", showResults);
        this._allUsers = showResults;
        this._contactsInGms = this.dataDeal(showResults);
        console.log("_contactsInGms ", this._contactsInGms);
    }

    protected async onReady() {
        this.generalContactsList();
    }

}