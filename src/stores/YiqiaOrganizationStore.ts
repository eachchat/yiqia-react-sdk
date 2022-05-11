import { IState } from "../accessibility/RovingTabIndex";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { YiqiaOrganizationItemClickedPayload } from "../dispatcher/payloads/ViewYiqiaContactPayload";
import { DepartmentModal, UserModal } from "../models/YiqiaModels";
import { arrayHasDiff } from "../utils/arrays";
import { objectClone } from "../utils/objects";
import { YiqiaContact } from "../utils/yiqiaUtils/YiqiaContact";
import { UPDATE_EVENT } from "./AsyncStore";
import { AsyncStoreWithClient } from "./AsyncStoreWithClient";

export const ORGANIZATION_ITEM_CLICKED_EVENT = Symbol("organization_item_clicked_event");
export const ORGANIZATION_MEMBER_UPDATE_EVENT = Symbol("organization_member_update_event");

export default class YiqiaOrganizationStore extends AsyncStoreWithClient<IState> {
    private _orgMembers: UserModal[] = [];
    private _orgDate: DepartmentModal[];
    private _departmentId2Member: Map<string, UserModal[]> = new Map();
    public static YiqiaOrganizationStoreInstance = new YiqiaOrganizationStore();
    constructor() {
        super(defaultDispatcher)
    }

    public static get Instance() {
        return YiqiaOrganizationStore.YiqiaOrganizationStoreInstance;
    }

    public get curOrgMembers() {
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
            if(resp && resp.length > 0) {
                console.log("fetchNewOrgMembers resp ", resp);
                if(this._departmentId2Member.has(departmentId)) {
                    console.log("this._departmentId2Member ", this._departmentId2Member);
                    if(!arrayHasDiff(resp, this._departmentId2Member.get(departmentId))) {
                        return;
                    }
                }
                this._departmentId2Member.set(departmentId, resp);
                console.log("this._departmentId2Member after set ", this._departmentId2Member);
                this._orgMembers = objectClone(resp);
                console.log("this._orgMembers after set ", this._orgMembers);
                this.emit(ORGANIZATION_MEMBER_UPDATE_EVENT);
            }
        })
    }

    protected async onAction(payload: YiqiaOrganizationItemClickedPayload): Promise<void> {
        if(payload.action === "yiqia_organization_item_clicked") {
            this.getOrgMembers(payload.departmentName);
        }
    }

    protected async generalOrganizations(): Promise<void> {
        const results = await YiqiaContact.Instance.yiqiaOrganization();
        // const userResults = await YiqiaContact.Instance.yiqiaAllOrganizationMemberInfo();
        console.log("======showResults is ", results);
        // console.log("======userResults is ", userResults);
        this._orgDate = results;
        // const results = await YiqiaContact.Instance.yiqiaOrganizationInfo();
        // console.log("======allShowResults is ", results);
    }

    protected async onReady() {
        this.generalOrganizations();
    }

}