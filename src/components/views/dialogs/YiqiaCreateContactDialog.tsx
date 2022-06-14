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
    value?: string;
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
    const [inputValue, setInputValue] = useState(props.value);
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

    console.log("props.value ", props.value);
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
            value={props.value}
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
                user={props.user}
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
        userInstance.create2Model(key, value);
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
            if(!props.user) {
                YiqiaContact.Instance.yiqiaContactAdd(userInstance).then(async (res) => {
                    await YiqiaContactContactStore.Instance.generalContactsList()
                    props.onFinished();
                })
            } else {
                YiqiaContact.Instance.yiqiaContactUpdate(userInstance).then(async (res) => {
                    await YiqiaContactContactStore.Instance.generalContactsList()
                    props.onFinished();
                })
            }
        }
        catch(error) {
            console.log("YiqiaCreateContactItem error ", error);
        }
    }

    useEffect(() => {
        if(!userInstance) {
            console.log("======== props.user ", props.user);
            if(props.user) {
                setUserInstance(props.user);
            } else {
                setUserInstance(new UserModal());
            }
        }
    }, []);

    const getDefaultInfo = (theKey) => {
        if(!props.user) return "";
        switch(theKey){
            case "telephone":
                return props.user.phoneNumbers && props.user.phoneNumbers[0]?.value
            case "email":
                return props.user.emailList && props.user.emailList[0]?.value
            case "url":
                return props.user.urlList && props.user.urlList[0]?.value
            case "date":
                return props.user.dateList && props.user.dateList[0]?.value
            case "impp":
                return props.user.imppList && props.user.imppList[0]?.value
            case "address":
                return props.user.addressList && props.user.addressList[0]?.streetAddress
            case "family":
                return props.user?.family;
            case "given":
                return props.user?.given;
            default:
                return props.user[theKey];
        }
    }

    return (
        <BaseDialog
            className="yiqia_CreateContact_dialog"
            onFinished={onFinished}
            title={_t("Create Contact")}
        >
            <form onSubmit={onSubmit} className="yiqia_ContactCreate_form">
                    <AutoHideScrollbar className="yiqia_ContactCreate_scroll">
                        {
                            Object.keys(CreateContact).map(key => {
                                if(!expanded && Object.keys(CreateContactSimple).indexOf(key) < 0) return null;
                                const placeHolderText = _t(CreateContact[key])
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
                                                value={getDefaultInfo(key)}
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
                                                hasType={false}
                                                value={getDefaultInfo(key)}/>
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
                                                hasType={false}
                                                value={getDefaultInfo(key)}/>
                                        )
                                        break;
                                }
                            })
                        }
                    </AutoHideScrollbar>
                    {
                        !expanded &&
                        <div
                            style={{color: "blue", cursor: "pointer"}}
                            onClick={() => {setExpanded(!expanded)}}
                        >显示更多</div>
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