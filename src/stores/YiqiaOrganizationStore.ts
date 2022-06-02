import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { YiqiaOrganizationItemClickedPayload } from "../dispatcher/payloads/ViewYiqiaContactPayload";
import { DepartmentModal, UserModal } from "../models/YiqiaModels";
import { arrayHasDiff } from "../utils/arrays";
import { objectClone, objectHasDiff } from "../utils/objects";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { YiqiaBaseUserStore } from "./YiqiaBaseUserStore";

export const ORGANIZATION_ITEM_CLICKED_EVENT = Symbol("organization_item_clicked_event");
export const ORGANIZATION_MEMBER_UPDATE_EVENT = Symbol("organization_member_update_event");

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

    public hasReporter(user) {
        let curUserinfo = this._allUsersWithMatrixId.get(user.matrixId);
        if(!curUserinfo) {
            curUserinfo = this._allUsersWithId.get(user.id);
        }
        return !!curUserinfo;
    }

    public TheManagerInfo(user) {
        let index = 0;
        const combined = "→";
        const managerList = [];
        let curUserinfo = this._allUsersWithMatrixId.get(user.matrixId);
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
        this.fetchNewOrgMembers(departmentId);
    }

    private async fetchNewOrgMembers(departmentId) {
        YiqiaContact.Instance.yiqiaOrganizationMemberInfo(departmentId).then((resp) => {
            console.log("fetchNewOrgMembers ", resp)
            if(resp && resp.length > 0) {
                const showResults = resp.map((orgMember: UserModal) => {
                    const usermodal = new UserModal(orgMember.matrixId, orgMember.DisplayName, orgMember.photoUrl,orgMember.DisplayNamePy);
                    usermodal.updateProperty(orgMember);
                    return usermodal;
                })
                this._orgMembers = this.dataDeal(showResults);
                if(this._departmentId2Member.has(departmentId)) {
                    if(!objectHasDiff(this._orgMembers, this._departmentId2Member.get(departmentId))) {
                        return;
                    }
                }
                this._departmentId2Member.set(departmentId, this._orgMembers);
                this.emit(ORGANIZATION_MEMBER_UPDATE_EVENT);
            }
        })
    }

    protected async onAction(payload: YiqiaOrganizationItemClickedPayload): Promise<void> {
        if(payload.action === "yiqia_organization_item_clicked") {
            this.getOrgMembers(payload.departmentName);
        }
    }

    public async generalOrganizations(): Promise<void> {
        YiqiaContact.Instance.yiqiaOrgMembers().then((res) => {
            for(const user of res) {
                this._allUsersWithId.set(user.id, user);
                this._allUsersWithMatrixId.set(user.matrixId, user);
            }
        })
        const results = await YiqiaContact.Instance.yiqiaOrganization();
        this._orgDate = results;
    }

    protected async onReady() {
        this.generalOrganizations();
    }

}