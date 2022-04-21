import * as YiqiaRequestInstance from "./YiqiaRequestUtils";
import { MatrixClientPeg } from '../../MatrixClientPeg';

export class AuthApi {
    public static AuthApiInstance;
    private host: string;
    private accessToken: string;

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
        const authOpts = this.getAuthOptions();
        return YiqiaRequestInstance.get("/api/apps/org/v1/count/media", authOpts);
    }

    protected fetchVideoState() {
        const authOpts = this.getAuthOptions();
        return YiqiaRequestInstance.get("/api/apps/org/v1/count/video", authOpts);
    }

    protected fetchAudioState() {
        const authOpts = this.getAuthOptions();
        return YiqiaRequestInstance.get("/api/apps/org/v1/count/audio", authOpts);
    }

    protected contactSearch(params) {
        const Opts = Object.assign({}, params, this.getAuthOptions());
        return YiqiaRequestInstance.post("/api/apps/org/v1/search", Opts);
    }

    private getHost() {
        if(!this.host) {
            this.initMatrixOptions();
        }
        return this.host;
    }

    private getAuthOptions() {
        if(!this.accessToken) {
            this.initMatrixOptions();
        }
        return Object.assign({}, {headers: 'Bearer ' + this.accessToken});
    }

    private initMatrixOptions() {
        let cli = MatrixClientPeg.get();
        let baseUrl = cli.getHomeserverUrl();
        let hServerUrl = new URL(baseUrl);
        this.accessToken = cli.getAccessToken();
        this.host = hServerUrl.host;
    }
}