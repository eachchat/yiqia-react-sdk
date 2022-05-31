import { Dispatcher } from "flux";
import defaultDispatcher from "../dispatcher/dispatcher"
import { ActionPayload } from "../dispatcher/payloads"
import { UserModal } from "../models/YiqiaModels";
import { AsyncStoreWithClient } from "./AsyncStoreWithClient"
import pinyin from 'pinyin';

export abstract class YiqiaBaseUserStore<T extends Object> extends AsyncStoreWithClient<T> {

    protected onAction(payload: ActionPayload): Promise<void> {
        return;
    }

    constructor(dispatcher: Dispatcher<ActionPayload>, initialState: T = <T>{}) {
        super(defaultDispatcher)
    }

    private getBGColorFromDisplayName(displayName) {
        let firstCharacterInUpper = "";
        let isZh = false;
        const firstText = displayName.slice(0, 1);
    
        if(firstText.charCodeAt(0) > 255) {
            firstCharacterInUpper = pinyin(firstText)[0][0].slice(0, 1).toUpperCase();
            isZh = true;
        }
        else {
            firstCharacterInUpper = firstText.toUpperCase();
            isZh = false;
        }
    
        return firstCharacterInUpper;
    }
    
    public dataDeal(data:UserModal[]): Map<string, UserModal[]> {
        const dealedDate:Map<string, UserModal[]> = new Map();
        data.forEach(item => {
            if(item.del === 1) return;
            const firstLetter = this.getBGColorFromDisplayName(item.DisplayName);
            if(dealedDate.has(firstLetter)) {
                dealedDate.get(firstLetter).push(item);
            } else {
                dealedDate.set(firstLetter, [item]);
            }
        })
        return new Map([...dealedDate.entries()].sort());
    }
}