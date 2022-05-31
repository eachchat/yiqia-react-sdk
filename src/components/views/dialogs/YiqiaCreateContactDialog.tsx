import React, { useEffect, useRef, useState } from "react";
import { Url } from "url";
import { _t } from "../../../languageHandler";
import { AddressType, DateType, Email, EmailType, Im, ImType, Phone, TelephoneType, UserModal } from "../../../models/YiqiaModels";
import { YiqiaContactContactStore } from "../../../stores/YiqiaContactContactStore";
import { objectClone } from "../../../utils/objects";
import { YiqiaContact } from "../../../utils/yiqiaUtils/YiqiaContact";
import AutoHideScrollbar from "../../structures/AutoHideScrollbar";
import ContextMenu, { ContextMenuTooltipButton, MenuItem } from "../../structures/ContextMenu";
import { ButtonEvent } from "../elements/AccessibleButton";
import Field from "../elements/Field";
import BaseDialog from "./BaseDialog";

interface IProps {
    id?: number;
    key?: string;
    busy: boolean;
    onInputChanged(key, value, id);
    label: string;
    placeHolder: string;
    isNecessary: boolean;
    hasType: boolean;
}

const CreateContact = {
    matrixId: "Please input Matrix ID",
    family: "Please input Family",
    given: "Please input Given",
    prefixes: "Please input prefixes",
    additionalName: "Please input additionalName",
    suffixes: "Please input suffixes",
    nickName: "Please input nickName",
    organization: "Please input Organization",
    telephone: "Please input telephone",
    email: "Please input email",
    title: "Please input title",
    address: "Please input address",
    url: "Please input url",
    impp: "Please input impp",
    date: "Please input date",
    note: "Please input note",
    categories: "Please input categories",
    department: "Please input department",
}

const CreateContactSimple = {
    matrixId: "Please input Matrix ID",
    family: "Please input Family",
    given: "Please input Given",
    nickName: "Please input nickName",
    organization: "Please input Organization",
    telephone: "Please input telephone",
    email: "Please input email",
}

interface TypeProps {
    type: string;
}

const enum OperateType {
    workOption = "work",
    homeOption= "home",
    otherOption= "other",
    cellOption= "cell",
    bdayOption= "bday",
    ANNIVERSARYOption= "anniversary",
    qqOption= "qq",
    whatsappOption= "whatsapp",
    teamsOption= "teams",
    messengerOption= "messenger",
    telegramOption= "telegram",
    skypeOption= "skype",
};

const YiqiaContactItemType:React.FC<TypeProps> = (props) => {
    let items: JSX.Element[];
    console.log("=====props is ", props);

    const onItemClick = (ev:ButtonEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        console.log("======= ev ", ev);
    }

    switch(props.type) {
        case "email":
            items = Object.keys(EmailType).map(key => {
                const showText = _t(key);
                return <MenuItem
                    label={showText}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "address":
            items = Object.keys(AddressType).map(key => {
                const showText = _t(key);
                return <MenuItem
                    label={showText}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "impp":
            items = Object.keys(ImType).map(key => {
                const showText = _t(key);
                return <MenuItem
                    label={showText}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "date":
            items = Object.keys(DateType).map(key => {
                const showText = _t(key);
                return <MenuItem
                    label={showText}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "date":
            items = Object.keys(TelephoneType).map(key => {
                const showText = _t(key);
                return <MenuItem
                    label={showText}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
    }

    const onFinished = () => {

    }

    return <React.Fragment>
        <ContextMenu 
                onFinished={onFinished}
                {...props}>
                    <div className="yiqia_contact_menu_list">
                        { items }
                    </div>
        </ContextMenu>
    </React.Fragment>
}

const YiqiaCreateContactBaseItem:React.FC<IProps> = (props) => {
    const [inputValue, setInputValue] = useState("");
    const [expanded, setExpanded] = useState(false);
    const onInputChanged = ev => {
        setInputValue(ev.target.value);
        props.onInputChanged(props.label, ev.target.value, props.id);
    };

    const onItemExpand = () => {
        setExpanded(!expanded);
    }

    const showText = _t(props.label);

    return (
        <div className="yiqia_CreateContact_base_item">
            <div className="yiqia_CreateContact_base_item_label">
                {
                    showText
                }
                {
                    props.isNecessary &&
                    <div className="yiqia_CreateContact_base_item_label_necessary">*</div>
                }
            </div>
            <Field
                className="yiqia_CreateContact_base_item_input"
                placeholder={props.placeHolder}
                usePlaceholderAsHint={true}
                value={inputValue}
                onChange={onInputChanged}
            />
            <div>
                {
                    props.hasType &&
                    <React.Fragment>
                        <ContextMenuTooltipButton
                            className="mx_RoomHeader_name"
                            onClick={onItemExpand}
                            isExpanded={expanded}
                            title={_t("Room options")}
                        >
                            {
                                expanded &&
                                <YiqiaContactItemType type={props.label}></YiqiaContactItemType>
                            }
                        </ContextMenuTooltipButton>
                    </React.Fragment>
                }
            </div>
        </div>
    )
}

const YiqiaCreateContactListItem:React.FC<IProps> = (props) => {
    const [listState, setListState] = useState<Map<number, number>>(new Map());
    const [itemObj, setItemObj] = useState<Phone | Im | Url | Date | Email>(null);

    const listRef = useRef<HTMLDivElement>(null);
    
    const onInputChanged = (key, value, id) => {
        const newListState = new Map();
        newListState.set(id, value);
        console.log("newListState ", newListState);
        listState.forEach((theValue, key) => {
            if(key !== id) {
                newListState.set(id, theValue);
            }
        })
        console.log("newListState 1", newListState);
        newListState.forEach((theValue, key) => {
            if(!theValue) newListState.delete(key);
        })

        console.log("newListState 2", newListState);
        setListState(newListState);

        console.log("key ", key, " value ", value, " id ", id, " content ", listState);

        props.onInputChanged(key, listState, null);
    };

    let content:React.ReactNode[] = [
        <YiqiaCreateContactBaseItem
            busy={props.busy}
            onInputChanged={onInputChanged}
            label={props.label}
            placeHolder={props.placeHolder}
            isNecessary={props.isNecessary}
            hasType={props.hasType}
            id={0}
        ></YiqiaCreateContactBaseItem>
    ];

    listState.forEach((user, key) => {
        console.log("======push ")
        content.push(
            <YiqiaCreateContactBaseItem
                busy={props.busy}
                onInputChanged={onInputChanged}
                label={props.label}
                placeHolder={props.placeHolder}
                isNecessary={props.isNecessary}
                hasType={props.hasType}
                id={key+1}
            ></YiqiaCreateContactBaseItem>
        )
    })

    console.log("======content ", listState);
    return (
        <div ref={listRef}>
            {
                content
            }
        </div>
    )
}

const YiqiaCreateContact:React.FC<{}> = (props) => {
    const [disableForm, setDisableForm] = useState(false);
    const [contactInfo, setContactInfo] = useState(null);
    const [userInstance, setUserInstance] = useState<UserModal>(null);
    const [expanded, setExpanded] = useState(false)

    const onFinished = () => {
        props.onFinished();
    }

    const onInputChanged = (key, value, id) => {
        console.log("=====key ", key, " ++++++++ value ", value);
        userInstance.create2Model(key, value);
        console.log("=====userInstance ", userInstance);
    }

    const onCancelClick = () => {
        props.onFinished();
    }

    const onSubmit = async(ev: React.FormEvent) => {
        ev.preventDefault();
        try{
            console.log("lllll ", userInstance);
            if(userInstance.given?.length == 0 || userInstance.family?.length == 0) {
                alert("input name");
            }
            YiqiaContact.Instance.yiqiaContactAdd(userInstance).then(res => {
                YiqiaContactContactStore.Instance.generalContactsList();
                props.onFinished();
            })
        }
        catch(error) {
            console.log("YiqiaCreateContactItem error ", error);
        }
    }

    useEffect(() => {
        if(!userInstance) {
            setUserInstance(new UserModal());
        }
    }, []);

    return (
        <BaseDialog
            className="yiqia_CreateContact_dialog"
            onFinished={onFinished}
            title={_t("Create Contact")}
        >
            <form onSubmit={onSubmit} className="yiqia_ContactCreate_form">
                {
                    expanded &&
                    <AutoHideScrollbar className="yiqia_ContactCreate_scroll">
                        {
                            Object.keys(CreateContact).map(key => {
                                const placeHolderText = _t(CreateContact[key])
                                console.log("all placeholder ", placeHolderText);
                                switch(key){
                                    case "telephone":
                                    case "email":
                                    case "url":
                                    case "date":
                                    case "impp":
                                        return (
                                            <YiqiaCreateContactListItem 
                                                busy={false}
                                                onInputChanged={onInputChanged}
                                                label={key}
                                                placeHolder={placeHolderText}
                                                isNecessary={false}
                                                hasType={false}
                                            >
                                            </YiqiaCreateContactListItem>
                                        )
                                        break;
                                    case "address":
                                        break;
                                    case "family":
                                    case "given":
                                        return (
                                            <YiqiaCreateContactBaseItem
                                                busy={false}
                                                onInputChanged={onInputChanged}
                                                label={key}
                                                placeHolder={placeHolderText}
                                                isNecessary={true}
                                                hasType={false}/>
                                        )
                                        break;
                                    default:
                                        return (
                                            <YiqiaCreateContactBaseItem
                                                busy={false}
                                                onInputChanged={onInputChanged}
                                                label={key}
                                                placeHolder={placeHolderText}
                                                isNecessary={false}
                                                hasType={false}/>
                                        )
                                        break;
                                }
                            })
                        }
                    </AutoHideScrollbar>
                }
                {
                    !expanded &&
                    <AutoHideScrollbar className="yiqia_ContactCreate_scroll">
                        {
                            Object.keys(CreateContactSimple).map(key => {
                                const placeHolderText = _t(CreateContactSimple[key])
                                switch(key){
                                    case "telephone":
                                    case "email":
                                    case "url":
                                    case "date":
                                    case "impp":
                                        return (
                                            <YiqiaCreateContactListItem 
                                                busy={false}
                                                onInputChanged={onInputChanged}
                                                label={key}
                                                placeHolder={placeHolderText}
                                                isNecessary={false}
                                                hasType={false}
                                            >
                                            </YiqiaCreateContactListItem>
                                        )
                                        break;
                                    case "address":
                                        break;
                                    case "family":
                                    case "given":
                                        return (
                                            <YiqiaCreateContactBaseItem
                                                busy={false}
                                                onInputChanged={onInputChanged}
                                                label={key}
                                                placeHolder={placeHolderText}
                                                isNecessary={true}
                                                hasType={false}/>
                                        )
                                        break;
                                    default:
                                        return (
                                            <YiqiaCreateContactBaseItem
                                                busy={false}
                                                onInputChanged={onInputChanged}
                                                label={key}
                                                placeHolder={placeHolderText}
                                                isNecessary={false}
                                                hasType={false}/>
                                        )
                                        break;
                                }
                            })
                        }
                        <div
                            style={{color: "blue", cursor: "pointer"}}
                            onClick={() => {setExpanded(!expanded)}}
                        >显示更多</div>
                    </AutoHideScrollbar>
                }
                <div className='mx_Dialog_buttons'>
                    <input
                        className='mx_Dialog_primary'
                        type='submit'
                        value={_t('Create')}
                        disabled={disableForm}
                    />
                    <button onClick={onCancelClick} disabled={disableForm}>
                        { _t("Cancel") }
                    </button>
                </div>
            </form>
        </BaseDialog>
    )
}

export default YiqiaCreateContact;