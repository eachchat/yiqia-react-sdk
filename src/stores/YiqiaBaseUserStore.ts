import { Dispatcher } from "flux";
import defaultDispatcher from "../dispatcher/dispatcher"
import { ActionPayload } from "../dispatcher/payloads"
import { UserModal } from "../models/YiqiaModels";
import { AsyncStoreWithClient } from "./AsyncStoreWithClient"

export abstract class YiqiaBaseUserStore<T extends Object> extends AsyncStoreWithClient<T> {

    protected onAction(payload: ActionPayload): Promise<void> {
        return;
    }

    constructor(dispatcher: Dispatcher<ActionPayload>, initialState: T = <T>{}) {
        super(defaultDispatcher)
    }

    public dataDeal(data:UserModal[]): Map<string, UserModal[]> {
        const dealedDate:Map<string, UserModal[]> = new Map();
        data.forEach(item => {
            const firstLetter = item.DisplayNamePy.slice(0, 1);
            if(dealedDate.has(firstLetter)) {
                dealedDate.get(firstLetter).push(item);
            } else {
                dealedDate.set(firstLetter, [item]);
            }
        })
        return new Map([...dealedDate.entries()].sort());
    }
}