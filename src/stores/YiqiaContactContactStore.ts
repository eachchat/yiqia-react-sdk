import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { GmsContact, UserModal } from "../models/YiqiaModels";
import { objectHasDiff } from "../utils/objects";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { YiqiaBaseUserStore } from "./YiqiaBaseUserStore";

export class YiqiaContactContactStore extends YiqiaBaseUserStore<IState> {
    private _contactsInGms: Map<string, UserModal[]> = new Map();
    private _allUsers: UserModal[] = [];
    public static YiqiaContactContactStoreInstance = new YiqiaContactContactStore();

    constructor() {
        super(defaultDispatcher)
    }

    public isUserInContact(user:UserModal) {
        let res = false;
        for(const conatct of this._allUsers) {
            if(user.matrixId === conatct.matrixId && conatct.del != 1) {
                res = true;
                break;
            }
        }
        return res;
    }

    public getContactFromId(matrixId) {
        if(!this._allUsers) return null;
        for(const conatct of this._allUsers) {
            if(matrixId === conatct.matrixId) {
                return conatct;
            }
        }
        return null;
    }

    public getContact(user:UserModal) {
        for(const conatct of this._allUsers) {
            if(user.matrixId === conatct.matrixId) {
                return conatct;
            }
        }
        return null;
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

    public async updateItemFromMatrix(item: UserModal): Promise<UserModal> {
        try{
            let userInfo;
            if(!item.matrixId) return item;
            userInfo = this.matrixClient?.getUser(item.matrixId);
            if(userInfo) {
                item.avatarUrl = userInfo.avatar_url || userInfo.avatarUrl;
                return item;
            }
            return item;
        }
        catch(error) {
            return item;
        }

    }

    public async generalContactsList(): Promise<void> {
        const results = await YiqiaContact.Instance.yiqiaContactContacts();
        const showResults = results.map((gmsContact: UserModal) => {
            const usermodal = new UserModal(gmsContact.matrixId, gmsContact.nickName, gmsContact.photoUrl, gmsContact.lastName);
            usermodal.updateProperty(gmsContact);
            return usermodal;
        })
        console.log("generalContactsList ", showResults);
        let newInfos = new Array();
        for(let i = 0; i < showResults.length; i++) {
            const user = showResults[i];
            const newInfo = await this.updateItemFromMatrix(user);
            newInfos.push(newInfo);
        }
        this._allUsers = [...newInfos];
        this._contactsInGms = this.dataDeal(showResults);
        console.log("_contactsInGms ", this._contactsInGms);
    }

    protected async onReady() {
        this.generalContactsList();
    }

}