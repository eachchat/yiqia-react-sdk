import React, { useEffect, useRef, useState } from "react";
import { _t } from "../../../languageHandler";
import Modal from "../../../Modal";
import Field from "../elements/Field";
import LabelledToggleSwitch from "../elements/LabelledToggleSwitch";
import withValidation, { IFieldState, IValidationResult } from "../elements/Validation";
import BaseDialog from "./BaseDialog";
import ErrorDialog from "./ErrorDialog";

interface IProps {
    onInputChanged(value);
    label: string;
    placeHolder: string;
}

const YiqiaBindMailbotBaseItem:React.FC<IProps> = (props) => {
    const [inputValue, setInputValue] = useState("");
    const onInputChanged = ev => {
        setInputValue(ev.target.value);
        props.onInputChanged(ev.target.value);
    };

    const onValidate = async ({ value }: Pick<IFieldState, "value">): Promise<IValidationResult> => {
        let noticeText = props.placeHolder;
        if(noticeText === "imap.example.com") noticeText = _t("Please input Bot Email Server Address");
        if(noticeText === "993") return;
        if(value.length === 0) return { valid: false, feedback: noticeText };
        return { valid: true };
    };
    
    return (
        <div className="yiqia_CreateContact_base_item">
            <div className="yiqia_CreateContact_base_item_label">
                {
                    props.label
                }
            </div>
            <Field
                className="yiqia_CreateContact_base_item_input"
                placeholder={props.placeHolder}
                usePlaceholderAsHint={true}
                value={inputValue}
                onChange={onInputChanged}
                onValidate={onValidate}
            />
        </div>
    )
}

const YiqiaBindMailbot:React.FC<{}> = (props) => {
    const [mailAddress, setMailAddress] = useState("");
    const [mailPassword, setMailPassword] = useState("");
    const [serverAddress, setServerAddress] = useState("");
    const [serverPort, setServerPort] = useState(993);
    const [isSSL, setIsSSL] = useState(false);
    const [disableForm, setDisableForm] = useState(false);

    const onFinished = () => {
        props.onFinished("");
    }

    const onSubmit = async(ev: React.FormEvent) => {
        ev.preventDefault();
        const comment = `!mail setup imap,${serverAddress}:${serverPort},${mailAddress},${mailPassword},INBOX,${isSSL}`;
        
        props.onFinished(comment);
    }

    return (
        <BaseDialog
            className="yiqia_BindMailbot_dialog"
            onFinished={onFinished}
            title={_t("Add Bot Email")}
        >
            <form onSubmit={onSubmit} className="yiqia_BindMailbot_form">
                <div className="yiqia_BindMailbot_scroll">
                    <div className="yiqia_Mail_info">
                        <div className="yiqia_Mail_Label">
                            IMAP
                        </div>
                        <div className="yiqia_Mail_Address">
                            <YiqiaBindMailbotBaseItem onInputChanged={(value) => {
                                setMailAddress(value)
                            }} label={_t("Bot Email Address")} placeHolder={_t("Please input Bot Email Address")}></YiqiaBindMailbotBaseItem>
                        </div>
                        <div className="yiqia_Mail_Password">
                            <YiqiaBindMailbotBaseItem onInputChanged={(value) => {
                                setMailPassword(value)
                            }} label={_t("Password")} placeHolder={_t("Please input Bot Email Password")}></YiqiaBindMailbotBaseItem>
                        </div>
                    </div>
                    <div className="yiqia_Mail_Server_info">
                        <div className="yiqia_Mail_Label">
                            {_t("IMAP Server Info")}
                        </div>
                        <div className="yiqia_Mail_Server_Address">
                            <YiqiaBindMailbotBaseItem onInputChanged={(value) => {
                                setServerAddress(value)
                            }} label={_t("IMAP Server Address")} placeHolder={"imap.example.com"}></YiqiaBindMailbotBaseItem>
                        </div>
                        <div className="yiqia_Mail_Server_Port">
                            <YiqiaBindMailbotBaseItem onInputChanged={(value) => {
                                setServerPort(value)
                            }} label={_t("IMAP Server Port")} placeHolder={"993"}></YiqiaBindMailbotBaseItem>
                        </div>
                        <div className="yiqia_Mail_server_ssl">
                            <LabelledToggleSwitch 
                                value={isSSL}
                                onChange={() => {
                                    setIsSSL(!isSSL)
                                }}
                                label={"SSL"}>
                            </LabelledToggleSwitch>
                        </div>
                    </div>
                </div>
                <div className='mx_Dialog_buttons'>
                    <input
                        className='mx_Dialog_primary'
                        type='submit'
                        value={_t('Sign in')}
                        disabled={disableForm}
                    />
                </div>
            </form>
        </BaseDialog>
    )
}

export default YiqiaBindMailbot;