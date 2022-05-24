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
        const results = await YiqiaContact.Instance.yiqiaOrganization();
        this._orgDate = results;
    }

    protected async onReady() {
        this.generalOrganizations();
    }

}