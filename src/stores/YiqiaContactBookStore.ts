import { AsyncStoreWithClient } from "./AsyncStoreWithClient";
import defaultDispatcher from "../dispatcher/dispatcher";
import { ActionPayload } from "../dispatcher/payloads";
import { UserModal, DepartmentModal } from "../models/YiqiaModels";
// import { getContact } from "../YiqiaUtils";

interface IState {
    enabled?: boolean;
}

export class YiqiaContactBookStore extends AsyncStoreWithClient<IState> {
    private static internalInstance = new YiqiaContactBookStore();

    private constructor() {
        super(defaultDispatcher);
    }

    protected async onAction(payload: ActionPayload): Promise<void> {
        // nothing
    }

    public static get instance(): YiqiaContactBookStore {
        return YiqiaContactBookStore.internalInstance;
    }

    // public getRoomDepartment(): Promise<DepartmentModal> {
    //     return new Promise((resolve, reject) => {
    //         getContact().then(ret => {
    //             console.log("ret is ", ret);
    //         })
    //     })
    // }
}