import { IState } from "../accessibility/RovingTabIndex";
import { Action } from "../dispatcher/actions";
import defaultDispatcher from "../dispatcher/dispatcher";
import { YiqiaOrganizationItemClickedPayload } from "../dispatcher/payloads/ViewYiqiaContactPayload";
import { DepartmentModal, UserModal } from "../models/YiqiaModels";
import { arrayHasDiff } from "../utils/arrays";
import { objectClone, objectHasDiff } from "../utils/objects";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { YiqiaBaseUserStore } from "./YiqiaBaseUserStore";

export const ORGANIZATION_ITEM_CLICKED_EVENT = Symbol("organization_item_clicked_event");
export const ORGANIZATION_MEMBER_UPDATE_EVENT = Symbol("organization_member_update_event");
export const ORGANIZATION_READY = Symbol("organization_ready");

export default class YiqiaOrganizationStore extends YiqiaBaseUserStore<IState> {
    private _orgMembers: Map<string, UserModal[]> = new Map();
    private _orgDate: DepartmentModal[];
    private _allUsersWithId = new Map();
    private _allUsersWithMatrixId = new Map();
    private _departmentId2Member: Map<string, Map<string, UserModal[]>> = new Map();
    public static YiqiaOrganizationStoreInstance = new YiqiaOrganizationStore();
    constructor() {
        super(defaultDispatcher)
    }

    public static get Instance() {
        return YiqiaOrganizationStore.YiqiaOrganizationStoreInstance;
    }

    public get curOrgMembers():Map<string, UserModal[]> {
        return this._orgMembers;
    }

    public get orgDate() {
        return this._orgDate;
    }

    public get orgName() {
        if(!this._orgDate) return "";
        return this._orgDate[0].name;
    }

    private findPathById(deps, depId, names) {
        if(typeof names === 'undefined') {
            names = [];
        }

        for(var i = 0; i < deps.length; i++) {
            var tmpPath = [...names];
            tmpPath.push(deps[i].name);
            if(deps[i].id === depId) {
                return tmpPath;
            }

            if(deps[i].children) {
                const res = this.findPathById(deps[i].children, depId, tmpPath);
                if(res) {
                    return res;
                }
            }
        }
    }

    public getOrgInfoFromHead(user) {
        const theSplit = " / ";
        const res = this.findPathById(this._orgDate, user.departmentId, []);
        console.log("res ", res);
        return res.join(theSplit);
    }

    public getOrgInfoFromUid(userId) {
        let curUserinfo = this._allUsersWithMatrixId.get(userId);
        if(!curUserinfo) {
            curUserinfo = this._allUsersWithId.get(userId);
        }
        return curUserinfo;
    }

    public getOrgInfo(user) {
        let curUserinfo = this._allUsersWithMatrixId.get(user.matrixId);
        if(!curUserinfo) {
            curUserinfo = this._allUsersWithId.get(user.id);
        }
        return curUserinfo;
    }

    public hasReporter(user) {
        let curUserinfo = this._allUsersWithMatrixId.get(user.matrixId);
        if(!curUserinfo) {
            curUserinfo = this._allUsersWithId.get(user.id);
        }
        return !!curUserinfo;
    }

    public TheManagerInfo(user) {
        console.log("TheManagerInfo ", user);
        let index = 0;
        const combined = "→";
        const managerList = [];
        let curUserinfo = this._allUsersWithMatrixId.get(user.matrixId);
        if(!curUserinfo) return;
        let usermodal = new UserModal(curUserinfo.matrixId, curUserinfo.DisplayName, curUserinfo.photoUrl,curUserinfo.DisplayNamePy);
        usermodal.updateProperty(curUserinfo);
        managerList.push(usermodal.DisplayName);
        while(curUserinfo.managerId) {
            index++;
            curUserinfo = this._allUsersWithId.get(curUserinfo.managerId);
            usermodal = new UserModal(curUserinfo.matrixId, curUserinfo.DisplayName, curUserinfo.photoUrl,curUserinfo.DisplayNamePy);
            usermodal.updateProperty(curUserinfo);
            managerList.push(usermodal.DisplayName);
        }
        return managerList.join(combined);
    }

    private getOrgMembers(departmentId) {
        if(this._departmentId2Member.has(departmentId)) {
            this._orgMembers = this._departmentId2Member.get(departmentId);
            this.emit(ORGANIZATION_ITEM_CLICKED_EVENT);
        }
        this.fetchNewOrgMembers(departmentId, true);
    }

    public async updateItemFromMatrix(item: UserModal, force=false): Promise<UserModal> {
        try{
            let userInfo;
            if(!item.matrixId) return item;
            userInfo = this.matrixClient?.getUser(item.matrixId);
            if(userInfo) {
                item.avatarUrl = userInfo.avatar_url;
                return item;
            }
            return item;
        }
        catch(error) {
            return item;
        }

    }

    private async updateItemFromMatrixAgain() {
        let newData = new Map<string, UserModal[]>();
        let needUpdate = false;
        for(const [key, value] of this._orgMembers.entries()) {
            let newList = [];
            for(let i = 0; i < value.length; i++) {
                const item = value[i];
                if(!item.avatarUrl) {
                    const gmsUserInfo = await this.matrixClient?.getProfileInfo(item.matrixId);
                    if(gmsUserInfo) {
                        item.avatarUrl = gmsUserInfo.avatar_url;
                        needUpdate = true;
                    }
                }
                newList.push(item);
            }
            newData.set(key, newList);
        }
        this._orgMembers = newData;
        if(needUpdate) {
            this.emit(ORGANIZATION_MEMBER_UPDATE_EVENT);
        }
    }

    private async fetchNewOrgMembers(departmentId, force=false) {
        YiqiaContact.Instance.yiqiaOrganizationMemberInfo(departmentId).then(async (resp) => {
            console.log("fetchNewOrgMembers ", resp)
            if(resp && resp.length > 0) {
                const showResults = resp.map((orgMember: UserModal) => {
                    const usermodal = new UserModal(orgMember.matrixId, orgMember.DisplayName, orgMember.photoUrl,orgMember.DisplayNamePy);
                    usermodal.updateProperty(orgMember);
                    return usermodal;
                })
                let newInfos = [];
                for(let i = 0; i < showResults.length; i++) {
                    const user = showResults[i];
                    const newInfo = await this.updateItemFromMatrix(user, force);
                    newInfos.push(newInfo);
                }
                this._orgMembers = this.dataDeal(newInfos);
                if(this._departmentId2Member.has(departmentId)) {
                    if(!objectHasDiff(this._orgMembers, this._departmentId2Member.get(departmentId))) {
                        return;
                    }
                }
                this._departmentId2Member.set(departmentId, this._orgMembers);
                this.emit(ORGANIZATION_MEMBER_UPDATE_EVENT);
            } else {
                this._orgMembers = new Map();
                this.emit(ORGANIZATION_MEMBER_UPDATE_EVENT);
            }
            this.updateItemFromMatrixAgain();
        })
    }

    protected async onAction(payload: YiqiaOrganizationItemClickedPayload): Promise<void> {
        if(payload.action === "yiqia_organization_item_clicked") {
            this.getOrgMembers(payload.departmentName);
        } else if(payload.action === Action.ViewYiqiaOrgMembers) {
            this._orgMembers = new Map();
        }
    }

    public async generalOrganizations(): Promise<void> {
        YiqiaContact.Instance.yiqiaOrgMembers().then((res) => {
            for(const user of res) {
                this._allUsersWithId.set(user.id, user);
                this._allUsersWithMatrixId.set(user.matrixId, user);
            }
            this.emit(ORGANIZATION_READY);
        })
        const results = await YiqiaContact.Instance.yiqiaOrganization();
        this._orgDate = results;
    }

    protected async onReady() {
        this.generalOrganizations();
    }

}