import * as YiqiaRequestInstance from "./YiqiaRequestUtils";
import { MatrixClientPeg } from '../../MatrixClientPeg';

export class AuthApi {
    public static AuthApiInstance;
    private host: string;
    private accessToken: string;
    private baseUrl: string;

    constructor() {
    }

    public static get Instance() {
        if(!this.AuthApiInstance) {
            this.AuthApiInstance = new AuthApi();
        }
        return this.AuthApiInstance;
    }

    protected fetchBookInfos() {
        const host = this.getHost();
        return YiqiaRequestInstance.get("/gms/v1/configuration/" + window.btoa(host));
    }

    protected fetchAttachmentState() {
        return YiqiaRequestInstance.newGet(this.baseUrl + "/api/apps/org/v1/count/media", this.accessToken);
    }

    protected fetchVideoState() {
        return YiqiaRequestInstance.newGet(this.baseUrl + "/api/apps/org/v1/count/video", this.accessToken);
    }

    protected fetchAudioState() {
        return YiqiaRequestInstance.newGet(this.baseUrl + "/api/apps/org/v1/count/audio", this.accessToken);
    }

    protected contactSearch(params) {
        return YiqiaRequestInstance.newPost(this.baseUrl + "/api/apps/org/v1/search", this.accessToken, params);
    }

    protected contactGmsInfoFromMatrixId(matrixId) {
        return YiqiaRequestInstance.newGet(this.baseUrl + "/api/apps/org/v1/user/matrix/" + matrixId, this.accessToken)
    }

    protected contactGmsContact(params) {
        return YiqiaRequestInstance.newPost(this.baseUrl + "/api/apps/contacts/v1/increment", this.accessToken, params)
    }

    protected contactOrganization(departmentId) {
        return YiqiaRequestInstance.newGet(this.baseUrl + "/api/apps/org/v1/server/departments/tree/1", this.accessToken)
    }

    protected contactOrganizationInfo(params) {
        return YiqiaRequestInstance.newPost(this.baseUrl + "/api/apps/org/v1/departments", this.accessToken, params)
    }

    protected contactOrganizationMemberInfo(params) {
        return YiqiaRequestInstance.newPost(this.baseUrl + "/api/apps/org/v1/server/departments/users", this.accessToken, params)
    }

    private getHost() {
        if(!this.host) {
            this.initMatrixOptions();
        }
        return this.host;
    }

    private initMatrixOptions() {
        let cli = MatrixClientPeg.get();
        this.baseUrl = cli.getHomeserverUrl();
        let hServerUrl = new URL(this.baseUrl);
        this.accessToken = cli.getAccessToken();
        this.host = hServerUrl.host;
    }
}