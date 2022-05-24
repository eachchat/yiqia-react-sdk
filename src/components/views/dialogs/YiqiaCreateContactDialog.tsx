import React, { useEffect, useRef, useState } from "react";
import { Url } from "url";
import { _t } from "../../../languageHandler";
import { AddressType, DateType, Email, EmailType, Im, ImType, Phone, TelephoneType, UserModal } from "../../../models/YiqiaModels";
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
    matrixId: _t("Please input Matrix ID"),
    family: _t("Please input Family"),
    given: _t("Please input Given"),
    prefixes: _t("Please input prefixes"),
    additionalName: _t("Please input additionalName"),
    suffixes: _t("Please input suffixes"),
    nickName: _t("Please input nickName"),
    organization: _t("Please input Organization"),
    telephone: _t("Please input telephone"),
    email: _t("Please input email"),
    title: _t("Please input title"),
    address: _t("Please input address"),
    url: _t("Please input url"),
    impp: _t("Please input impp"),
    date: _t("Please input date"),
    note: _t("Please input note"),
    categories: _t("Please input categories"),
}

const CreateContactNoTrans = {
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
                return <MenuItem
                    label={_t(key)}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "address":
            items = Object.keys(AddressType).map(key => {
                return <MenuItem
                    label={_t(key)}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "impp":
            items = Object.keys(ImType).map(key => {
                return <MenuItem
                    label={_t(key)}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "date":
            items = Object.keys(DateType).map(key => {
                return <MenuItem
                    label={_t(key)}
                    className="yiqia_contact_type_option"
                    onClick={onItemClick}>
                    <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
                </MenuItem>
            })
            break;
        case "date":
            items = Object.keys(TelephoneType).map(key => {
                return <MenuItem
                    label={_t(key)}
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

    return (
        <div className="yiqia_CreateContact_base_item">
            <div className="yiqia_CreateContact_base_item_label">
                {
                    props.label
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
    const [listState, setListState] = useState<Map<string, UserModal>>(new Map());
    const [itemObj, setItemObj] = useState<Phone | Im | Url | Date | Email>(null);
    const listRef = useRef<HTMLDivElement>(null);
    
    const onInputChanged = (key, value, id) => {
        if(listState.has(id)) {
            const curState = listState.get(id);
            curState[key]
        }
        props.onInputChanged(key, value, null);
    };

    return (
        <div ref={listRef}>
            <YiqiaCreateContactBaseItem
                busy={props.busy}
                onInputChanged={onInputChanged}
                label={props.label}
                placeHolder={props.placeHolder}
                isNecessary={props.isNecessary}
                hasType={props.hasType}
            ></YiqiaCreateContactBaseItem>
        </div>
    )
}

const YiqiaCreateContact:React.FC<{}> = () => {
    const [disableForm, setDisableForm] = useState(false);
    const [contactInfo, setContactInfo] = useState(null);
    const [userInstance, setUserInstance] = useState<UserModal>(null);

    const onFinished = () => {

    }

    const onInputChanged = (key, value, id) => {
        console.log("=====key ", key, " ++++++++ value ", value);
        userInstance.create2Model(key, value);
    }

    const onCancelClick = () => {

    }

    const onSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        // this.startImport(this.file.current.files[0], this.passphrase.current.value);
        return false;
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
                <AutoHideScrollbar className="yiqia_ContactCreate_scroll">
                    {
                        Object.keys(CreateContactNoTrans).map(key => {
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
                                            placeHolder={CreateContactNoTrans[key]}
                                            isNecessary={false}
                                            hasType={true}
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
                                            placeHolder={CreateContactNoTrans[key]}
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
                                            placeHolder={CreateContact[key]}
                                            isNecessary={false}
                                            hasType={false}/>
                                    )
                                    break;
                            }
                        })
                    }
                </AutoHideScrollbar>
                <div className='mx_Dialog_buttons'>
                    <input
                        className='mx_Dialog_primary'
                        type='submit'
                        value={_t('Export')}
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