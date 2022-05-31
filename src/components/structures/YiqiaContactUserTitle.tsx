import React, { useState } from "react";
import { IProps as IContextMenuProps } from "../structures/ContextMenu";
import { _t } from "../../languageHandler";
import { ContactTagId } from "../../models/YiqiaModels";
import YiqiaContactUserStore from "../../stores/YiqiaContactUserStore";
import { ButtonEvent } from "../views/elements/AccessibleButton";
import ContextMenu, { ContextMenuTooltipButton, MenuItem } from "./ContextMenu";
import { contextMenuBelow } from "../views/rooms/RoomTile";
import { YiqiaContact } from "../../utils/yiqiaUtils/YiqiaContact";
import Modal from "../../Modal";
import YiqiaAddContactDialog from "../views/dialogs/YiqiaAddContactDialog";
import YiqiaCreateContact from "../views/dialogs/YiqiaCreateContactDialog";

enum OPERATE_TYPE {
    EXPORT = "export",
    ADD = "add",
};

interface IProps extends IContextMenuProps {
    operateType:OPERATE_TYPE;
    pageShouldUpdate();
}

// XXX: workaround for https://github.com/microsoft/TypeScript/issues/31816
interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
}

enum ImportState {
    LOADING = "loading",
    DONE = "done",
}

const YiqiaContactHeaderContextMenu = ({operateType, onFinished, pageShouldUpdate, ...props}:IProps) => {
    const [importState, setImportState] = useState(ImportState.LOADING);
    let importOption: JSX.Element;
    let exportOption: JSX.Element;
    let addOption: JSX.Element;
    let createOption: JSX.Element;
    console.log("=====props is ", props);
    console.log("=====importState is ", importState);

    const vCardFileImport = async (): Promise<any> => {
        return new Promise((resolve) => {
            const fileSelector = document.createElement('input');
            fileSelector.setAttribute('type', 'file');
            fileSelector.onchange = (ev: HTMLInputEvent) => {
                setImportState(ImportState.LOADING);
                const file = ev.target.files[0];
                YiqiaContact.Instance.yiqiaContactImport(file).then(resp => {
                    setImportState(ImportState.DONE);
                    pageShouldUpdate();
                })
            };
    
            fileSelector.click();
            onFinished();
        });
    };

    const vCardFileExport = () => {
        setImportState(ImportState.LOADING);
        YiqiaContact.Instance.yiqiaContactExport().then((resp) => {
            console.log("resp ", resp);
            const a: HTMLAnchorElement = document.createElement("a");
            a.id = "a";
            a.rel = "noreferrer noopener";
            a.download = "yiqiaContact.vcf";
            // @ts-ignore
            a.style.fontFamily = "Arial, Helvetica, Sans-Serif";
            a.href = URL.createObjectURL(new Blob([resp]));
            a.click();
            setImportState(ImportState.DONE);
            onFinished();
            pageShouldUpdate();
        })
    }
    
    const vCardAdd = async () => {
        const { finished } = Modal.createTrackedDialog("Add Contact", "", YiqiaAddContactDialog);
        onFinished();
        const result = await finished;
        pageShouldUpdate();
    }

    const vCardCreate = async () => {
        onFinished();
        const { finished } = Modal.createTrackedDialog("Add Contact", "", YiqiaCreateContact);
        const result = await finished;
        pageShouldUpdate();
        
    }

    const onImportClick = (ev:ButtonEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        vCardFileImport();
    }

    const onExportClick = (ev:ButtonEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        vCardFileExport();
    }

    const onAddOptionClick = (ev:ButtonEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        vCardAdd();
    }

    const onCreateClick = (ev:ButtonEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        
        vCardCreate();
    }

    if(operateType === OPERATE_TYPE.EXPORT) {

        importOption = <MenuItem
            label={_t("Import")}
            className="yiqia_contact_import_option"
            onClick={onImportClick}>
            <span className="mx_IconizedContextMenu_label">{ _t("Import") }</span>
        </MenuItem>

        exportOption = <MenuItem
            label={_t("Export")}
            className="yiqia_contact_export_option"
            onClick={onExportClick}>
                <span className="mx_IconizedContextMenu_label">{ _t("Export") }</span>
            </MenuItem>
    } else {
        addOption = <MenuItem
            label={_t("Add")}
            className="yiqia_contact_add_option"
            onClick={onAddOptionClick}>
            <span className="mx_IconizedContextMenu_label">{ _t("Add") }</span>
        </MenuItem>

        createOption = <MenuItem
            label={_t("Create")}
            className="yiqia_contact_create_option"
            onClick={onCreateClick}>
            <span className="mx_IconizedContextMenu_label">{ _t("Create") }</span>
        </MenuItem>
    }

    return <React.Fragment>
        <ContextMenu 
                onFinished={onFinished}
                {...props}>
                    <div className="yiqia_contact_menu_list">
                        { importOption }
                        { exportOption }
                        { addOption }
                        { createOption }
                    </div>
        </ContextMenu>
    </React.Fragment>
}

const YiqiaContactUserTitle:React.FC<{onPageUpdate()}> = (props) => {
    const [exportMenuPosition, setExportMenuPosition] = useState(null)
    const [contactOperateMenuPosition, setContactOperateMenuPosition] = useState(null)

    const onExportMenuOpenClick = (ev: React.MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        const target = ev.target as HTMLButtonElement;
        setExportMenuPosition(target.getBoundingClientRect());
    }

    const onExportMenuCloseClick = () => {
        setExportMenuPosition(null);
    };

    const onContactOperateMenuOpenClick = (ev: React.MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        const target = ev.target as HTMLButtonElement;
        setContactOperateMenuPosition(target.getBoundingClientRect());
    }

    const onContactOperateMenuCloseClick = () => {
        setContactOperateMenuPosition(null);
    };

    const isContact = () => {
        return YiqiaContactUserStore.instance.curItem === ContactTagId.Contact;
    }

    let exportOperateContextMenu: JSX.Element;
    let addOperateContextMenu: JSX.Element;

    if(exportMenuPosition) {
        exportOperateContextMenu = (
            <YiqiaContactHeaderContextMenu
                {...contextMenuBelow(exportMenuPosition)}
                operateType={OPERATE_TYPE.EXPORT}
                onFinished={onExportMenuCloseClick}
                pageShouldUpdate={props.onPageUpdate}
                />
        )
    }

    if(contactOperateMenuPosition) {
        addOperateContextMenu = (
            <YiqiaContactHeaderContextMenu
                {...contextMenuBelow(contactOperateMenuPosition)}
                operateType={OPERATE_TYPE.ADD}
                onFinished={onContactOperateMenuCloseClick}
                pageShouldUpdate={props.onPageUpdate}
            />
        )
    }

    let operate: JSX.Element
    if(isContact()) {
        operate = (
           <ContextMenuTooltipButton
               className="yiqia_ContactHeader_operate yiqia_ContactHeader_operate_Ico"
               onClick={onContactOperateMenuOpenClick}
               isExpanded={!!contactOperateMenuPosition}
               title={_t("Import or Export")}>
                    { addOperateContextMenu }
           </ContextMenuTooltipButton>
       )
    }

    const getTitle = ()=> {
        let title = _t("Recents");
        switch(YiqiaContactUserStore.instance.curItem) {
            case ContactTagId.Recent:
                title = _t("Recents");
                break;
            case ContactTagId.Contact:
                title = _t("Contacts");
                break;
            case ContactTagId.Organization:
                title = _t("Organization");
                break;
            case ContactTagId.Teams:
                title = _t("Teams");
                break;
        }
        return title;
    }

    const name = (
        <ContextMenuTooltipButton
            className="yiqia_ContactHeader_name"
            onClick={onExportMenuOpenClick}
            isExpanded={!!exportMenuPosition}
            title={_t("Name")}>
                <div className="yiqia_ContactHeader_namttext">
                    { getTitle() }
                </div>
                { isContact() && <div className="yiqia_ContactHeader_chevron" /> }
                { exportOperateContextMenu }
        </ContextMenuTooltipButton>
    )
    
    return(
        <div className="yiqia_ContactUserHeader">
            { name }
            { operate }
        </div>
    )
}

export default YiqiaContactUserTitle;