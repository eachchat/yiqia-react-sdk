import { UserModal } from "../../models/YiqiaModels";
import { AuthApi } from "./YiqiaRequestInterface";

export class YiqiaContact {
    private static YiqiaContactInstance;
    private lastUpdateTime:number = 0;
    constructor() {

    }

    public static get Instance() {
        if(!this.YiqiaContactInstance) {
            this.YiqiaContactInstance = new YiqiaContact();
        }
        return this.YiqiaContactInstance;
    }

    public yiqiaGmsInfoFromMatrixId(matrixId): Promise<UserModal> {
        return AuthApi.Instance.contactGmsInfoFromMatrixId(matrixId)
            .then(resp => {
                if(resp && resp.code == 200 && resp.obj) {
                    return resp.obj;
                } else {
                    return null;
                }
            })
            .catch((err) => {
                console.log("err ", err);
                return null;
            })
    }

    public yiqiaGmsSearch(term): Promise<UserModal> {
        return AuthApi.Instance.contactSearch(
                {
                    keyword: term.trim(),
                },
            )
            .then((resp) => {
                if(resp && resp.code == 200 && resp.results) {
                    return resp;
                } else {
                    return [];
                }
            })
            .catch((err) => {
                console.log("err ", err);
                return [];
            })
    }

    private yiqiaContactContactsUtil(params) {
        return AuthApi.Instance.contactGmsContact(params);
    }

    public async yiqiaContactContacts(): Promise<UserModal[]> {
        const maxTimes = 10;
        let sequenceId = 0;
        let hasNext = true;
        let fetchTimes = 0;
        let finalList = [];
        while(hasNext) {
            fetchTimes++;
            const params = {
                name: "updateContact",
                updateTime: 0,
                perPage: 50,
                sequenceId: sequenceId,
            };
            const resp = await this.yiqiaContactContactsUtil(params);

            if(resp && resp.code == 200 && resp.results) {
                this.lastUpdateTime = resp.obj.updateTime;
                finalList = finalList.concat(resp.results);
                sequenceId = finalList.length;
                if(sequenceId >= resp.total) {
                    hasNext = false;
                }
            } else {
                return finalList;
            }
            if(fetchTimes > maxTimes) {
                return finalList;
            }
        }
        return finalList;
    }
}

// export class ContactFetcher {
//     private static internalInstance: ContactFetcher;
//     private cli: any;
//     private homeserver_base_url: string;
//     private hAccessToken: string;

//     private constructor() {
//         this.cli = MatrixClientPeg.get();
//         this.homeserver_base_url = this.cli.getHomeserverUrl();
//         this.fetchContactInfos();
//     }

//     public static get instance(): ContactFetcher {
//         if(!this.internalInstance) {
//             this.internalInstance = new ContactFetcher();
//         }
//         return ContactFetcher.internalInstance;
//     }

//     private async fetchContactInfos() {
//         if(!this.hAccessToken) {
//             this.hAccessToken = await this.cli.getAccessToken();
//         }
//         this._fetchDepartmentInfos();
//         this._fetchUserInfos();
//     }

//     private async _fetchDepartmentInfos(sequenceId = 0) {
//         let newSequence = sequenceId;
//         try {
//             const allInfo = await (await fetch(this.homeserver_base_url + "/api/apps/org/v1/increment", {
//                     method: "POST",
//                     mode: "cors",
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Accept': 'application/json',
//                         'Authorization': 'Bearer ' + this.hAccessToken,
//                     },
//                     body: JSON.stringify({
//                         name: "updateDepartment",
//                         updateTime: 0,
//                         perPage: 10,
//                         sequenceId: newSequence,
//                     }),
//                 })).json();
//             console.log(allInfo);
//             for(let index in allInfo.data.results) {
//                 newSequence++;
//                 const item = allInfo.data.results[index];
//             }
//         } catch(error) {
    
//         }
//     }

//     private async _fetchUserInfos(sequenceId = 0) {

//     }
// }

// export async function getContact(): Promise<DepartmentModal[]> {
//     const matrixClient = MatrixClientPeg.get();
//     const homeserver_base_url = matrixClient.getHomeserverUrl();
//     const hAccessToken = await matrixClient.getAccessToken();

//     try {
//         const allInfo = await (await fetch(homeserver_base_url + "/api/apps/org/v1/increment", {
//                 method: "POST",
//                 mode: "cors",
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json',
//                     'Authorization': 'Bearer ' + hAccessToken,
//                 },
//                 body: JSON.stringify({
//                     name: "updateDepartment",
//                     updateTime: 0,
//                     perPage: 10,
//                     sequenceId: 0,
//                 }),
//             })).json();
//         console.log(allInfo);
//         return allInfo.results;
//         }
//     catch(error) {

//     }
// }