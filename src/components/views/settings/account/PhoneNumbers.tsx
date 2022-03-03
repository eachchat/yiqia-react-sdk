/*
Copyright 2019 New Vector Ltd
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { IThreepid, ThreepidMedium } from "matrix-js-sdk/src/@types/threepids";
import { logger } from "matrix-js-sdk/src/logger";

import { _t } from "../../../../languageHandler";
import { MatrixClientPeg } from "../../../../MatrixClientPeg";
import Field from "../../elements/Field";
import AccessibleButton from "../../elements/AccessibleButton";
import AddThreepid from "../../../../AddThreepid";
import CountryDropdown from "../../auth/CountryDropdown";
import Modal from '../../../../Modal';
import { replaceableComponent } from "../../../../utils/replaceableComponent";
import ErrorDialog from "../../dialogs/ErrorDialog";
import { PhoneNumberCountryDefinition } from "../../../../phonenumber";
import SdkConfig from '../../../../SdkConfig';
import * as PhoneNumber from '../../../../phonenumber';

/*
TODO: Improve the UX for everything in here.
This is a copy/paste of EmailAddresses, mostly.
 */

// TODO: Combine EmailAddresses and PhoneNumbers to be 3pid agnostic

interface IExistingPhoneNumberProps {
    msisdn: IThreepid;
    onRemoved: (phoneNumber: IThreepid) => void;
    shareThreepidWhenBind?: boolean;
}

interface IExistingPhoneNumberState {
    verifyRemove: boolean;
    verifyingShare: boolean,
    addTask: any,
    continueDisabled: boolean,
    msisdn: IThreepid,
    newPhoneNumberCode: string,
    verifyError: string,
}

export class ExistingPhoneNumber extends React.Component<IExistingPhoneNumberProps, IExistingPhoneNumberState> {
    constructor(props: IExistingPhoneNumberProps) {
        super(props);

        this.state = {
            verifyRemove: false,
            verifyingShare: false,
            addTask: null,
            continueDisabled: false,
            msisdn: this.props.msisdn,
            newPhoneNumberCode: "",
            verifyError: "",
        };
    }

    private onRemove = (e: React.MouseEvent): void => {
        e.stopPropagation();
        e.preventDefault();

        this.setState({ verifyRemove: true });
    };

    private onDontRemove = (e: React.MouseEvent): void => {
        e.stopPropagation();
        e.preventDefault();

        this.setState({ verifyRemove: false });
    };

    private onChangeNewPhoneNumberCode = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({
            newPhoneNumberCode: e.target.value,
        });
    };

    private changeBindingTangledAddBind = async(): Promise<void> => {
        const { medium, address } = this.state.msisdn;

        const task = new AddThreepid();
        this.setState({
            verifyingShare: true,
            continueDisabled: true,
            addTask: task,
        });

        try {
            await MatrixClientPeg.get().deleteThreePid(medium, address);
            // XXX: Sydent will accept a number without country code if you add
            // a leading plus sign to a number in E.164 format (which the 3PID
            // address is), but this goes against the spec.
            // See https://github.com/matrix-org/matrix-doc/issues/2222
            await task.bindMsisdn(null, `+${address}`);
            this.setState({
                continueDisabled: false,
            });
        } catch (err) {
            logger.error(`Unable to share phone number ${address} ${err}`);
            this.setState({
                verifyingShare: false,
                continueDisabled: false,
                addTask: null,
            });
            Modal.createTrackedDialog(`Unable to share phone number`, '', ErrorDialog, {
                title: _t("Error"),
                description: ((err && err.message) ? err.message : _t("Operation failed")),
            });
        }
    }

    private onShareClicked = async(): Promise<void> => {
        if (!(await MatrixClientPeg.get().doesServerSupportSeparateAddAndBind())) {
            return this.changeBindingTangledAddBind();
        }

        const { address } = this.state.msisdn;

        try {
            const task = new AddThreepid();
            this.setState({
                verifyingShare: true,
                continueDisabled: true,
                addTask: task,
            });
            // XXX: Sydent will accept a number without country code if you add
            // a leading plus sign to a number in E.164 format (which the 3PID
            // address is), but this goes against the spec.
            // See https://github.com/matrix-org/matrix-doc/issues/2222
            await task.bindMsisdn(null, `+${address}`);
            this.setState({
                continueDisabled: false,
            });
        } catch (err) {
            logger.error(`Unable to share phone number ${address} ${err}`);
            this.setState({
                verifyingShare: false,
                continueDisabled: false,
                addTask: null,
            });
            Modal.createTrackedDialog(`Unable to share phone number`, '', ErrorDialog, {
                title: _t("Error"),
                description: ((err && err.message) ? err.message : _t("Operation failed")),
            });
        }
    }

    private onContinueClick = (e: React.MouseEvent | React.FormEvent): void => {
        e.stopPropagation();
        e.preventDefault();

        this.setState({ continueDisabled: true });
        const token = this.state.newPhoneNumberCode;
        this.state.addTask.haveMsisdnToken(token, true).then(() => {
            const updateMsisdn = Object.assign({}, this.state.msisdn, { bound: true });
            
            this.setState({
                addTask: null,
                continueDisabled: false,
                verifyingShare: false,
                verifyError: null,
                msisdn: updateMsisdn,
                newPhoneNumberCode: "",
            });
        }).catch((err) => {
            this.setState({ continueDisabled: false });
            if (err.errcode !== 'M_THREEPID_AUTH_FAILED') {
                logger.error("Unable to verify phone number: " + err);
                Modal.createTrackedDialog(_t("Unable to verify phone number."), '', ErrorDialog, {
                    title: _t("Unable to verify phone number."),
                    description: ((err && err.message) ? _t("Unable to verify phone number.") : _t("Operation failed")),
                });
            } else {
                this.setState({ verifyError: _t("Incorrect verification code") });
            }
        });
    };

    private onActuallyRemove = (e: React.MouseEvent): void => {
        e.stopPropagation();
        e.preventDefault();

        MatrixClientPeg.get().deleteThreePid(this.state.msisdn.medium, this.state.msisdn.address).then(() => {
            return this.props.onRemoved(this.state.msisdn);
        }).catch((err) => {
            logger.error("Unable to remove contact information: " + err);
            Modal.createTrackedDialog('Remove 3pid failed', '', ErrorDialog, {
                title: _t("Unable to remove contact information"),
                description: ((err && err.message) ? err.message : _t("Operation failed")),
            });
        });
    };

    public render(): JSX.Element {
        const defaultCountryCode = SdkConfig.get()['defaultCountryCode'];
        const forceOnlyDefaultCountry = SdkConfig.get()["forceOnlyDefaultCountry"];
        const phoneAddress = (defaultCountryCode && forceOnlyDefaultCountry) ? PhoneNumber.unpackagePhoneNumberWithDefaultCountry(this.state.msisdn.address) : this.state.msisdn.address;

        if (this.state.verifyRemove) {
            return (
                <div className="mx_ExistingPhoneNumber">
                    <span className="mx_ExistingPhoneNumber_promptText">
                        { _t("Remove %(phone)s?", { phone: phoneAddress }) }
                    </span>
                    <AccessibleButton
                        onClick={this.onActuallyRemove}
                        kind="danger_sm"
                        className="mx_ExistingPhoneNumber_confirmBtn"
                    >
                        { _t("Remove") }
                    </AccessibleButton>
                    <AccessibleButton
                        onClick={this.onDontRemove}
                        kind="link_sm"
                        className="mx_ExistingPhoneNumber_confirmBtn"
                    >
                        { _t("Cancel") }
                    </AccessibleButton>
                </div>
            );
        }

        let addVerifySection

        let phoneAddressContent = "+" + this.state.msisdn.address;
        let tipContent = _t("A text message has been sent to +%(msisdn)s. " +
        "Please enter the verification code it contains.", { msisdn: phoneAddressContent })

        if(defaultCountryCode && forceOnlyDefaultCountry) {
            phoneAddressContent = phoneAddress;
            tipContent = _t("A text message has been sent to %(msisdn)s. " +
            "Please enter the verification code it contains.", { msisdn: phoneAddressContent })
        }
        if (this.state.verifyingShare) {
            addVerifySection = (
                <div>
                    <div>
                        { tipContent }
                        <br />
                        { this.state.verifyError }
                    </div>
                    <form onSubmit={this.onContinueClick} autoComplete="off" noValidate={true}>
                        <Field
                            type="text"
                            label={_t("Verification code")}
                            autoComplete="off"
                            disabled={this.state.continueDisabled}
                            value={this.state.newPhoneNumberCode}
                            onChange={this.onChangeNewPhoneNumberCode}
                        />
                        <AccessibleButton
                            onClick={this.onContinueClick}
                            kind="primary_sm"
                            disabled={this.state.continueDisabled || this.state.newPhoneNumberCode.length === 0}
                        >
                            { _t("Continue") }
                        </AccessibleButton>
                    </form>
                </div>
            );
        }
        
        return (
            <div>
                <div className="mx_ExistingPhoneNumber">
                    <span className="mx_ExistingPhoneNumber_address">{ phoneAddressContent }</span>
                    {
                        this.props.shareThreepidWhenBind && !this.state.msisdn.bound && !this.state.verifyingShare &&
                        <AccessibleButton
                            onClick={this.onShareClicked}
                            kind="primary_sm"
                            className="mx_ExistingPhoneNumber_confirmBtn"
                        >
                            { _t("Share") }
                        </AccessibleButton>
                    }
                    <AccessibleButton
                        onClick={this.onRemove}
                        kind="danger_sm"
                        className="mx_ExistingPhoneNumber_confirmBtn"
                    >
                        { _t("Remove") }
                    </AccessibleButton>
                </div>
                { 
                    this.props.shareThreepidWhenBind && !this.state.msisdn.bound &&
                    addVerifySection 
                }
            </div>
        );
    }
}

interface IProps {
    msisdns: IThreepid[];
    onMsisdnsChange: (phoneNumbers: Partial<IThreepid>[]) => void;
}

interface IState {
    verifying: boolean;
    verifyError: string;
    verifyMsisdn: string;
    addTask: any; // FIXME: When AddThreepid is TSfied
    continueDisabled: boolean;
    phoneCountry: string;
    newPhoneNumber: string;
    newPhoneNumberCode: string;
    shareThreepidWhenBind: boolean;
}

@replaceableComponent("views.settings.account.PhoneNumbers")
export default class PhoneNumbers extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            verifying: false,
            verifyError: null,
            verifyMsisdn: "",
            addTask: null,
            continueDisabled: false,
            phoneCountry: "",
            newPhoneNumber: "",
            newPhoneNumberCode: "",
            shareThreepidWhenBind: SdkConfig.get()["shareThreepidWhenBind"],
        };
    }

    private onRemoved = (address: IThreepid): void => {
        const msisdns = this.props.msisdns.filter((e) => e.address != address.address);
        this.props.onMsisdnsChange(msisdns);
    };

    private onChangeNewPhoneNumber = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({
            newPhoneNumber: e.target.value,
        });
    };

    private onChangeNewPhoneNumberCode = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({
            newPhoneNumberCode: e.target.value,
        });
    };

    private onAddClick = (e: React.MouseEvent | React.FormEvent): void => {
        e.stopPropagation();
        e.preventDefault();

        if (!this.state.newPhoneNumber) return;

        const phoneNumber = this.state.newPhoneNumber;
        const phoneCountry = this.state.phoneCountry;

        const task = new AddThreepid();
        this.setState({ verifying: true, continueDisabled: true, addTask: task });

        task.addMsisdn(phoneCountry, phoneNumber).then((response) => {
            this.setState({ continueDisabled: false, verifyMsisdn: response.msisdn });
        }).catch((err) => {
            logger.error("Unable to add phone number " + phoneNumber + " " + err);
            this.setState({ verifying: false, continueDisabled: false, addTask: null });
            Modal.createTrackedDialog(_t('Add Phone Number Error'), '', ErrorDialog, {
                title: _t("Error"),
                description: ((err && err.message) ? _t('Add Phone Number Error') : _t("Operation failed")),
            });
        });
    };

    private onContinueClick = (e: React.MouseEvent | React.FormEvent): void => {
        e.stopPropagation();
        e.preventDefault();

        this.setState({ continueDisabled: true });
        const token = this.state.newPhoneNumberCode;
        const address = this.state.verifyMsisdn;
        this.state.addTask.haveMsisdnToken(token).then(([finished]) => {
            let newPhoneNumber = this.state.newPhoneNumber;
            if (finished) {
                if(this.state.shareThreepidWhenBind) {
                    this.state.addTask.haveMsisdnToken(token, true).then(() => {
                        const msisdns = [
                            ...this.props.msisdns,
                            { address, medium: ThreepidMedium.Phone, bound: true },
                        ];
                        this.props.onMsisdnsChange(msisdns);
                        newPhoneNumber = "";
                        this.setState({
                            addTask: null,
                            continueDisabled: false,
                            verifying: false,
                            verifyMsisdn: "",
                            verifyError: null,
                            newPhoneNumber,
                            newPhoneNumberCode: "",
                        });
                    }).catch((err) => {
                        this.setState({ continueDisabled: false });
                        if (err.errcode !== 'M_THREEPID_AUTH_FAILED') {
                            logger.error("Unable to verify phone number: " + err);
                            Modal.createTrackedDialog(_t("Unable to verify phone number."), '', ErrorDialog, {
                                title: _t("Unable to verify phone number."),
                                description: ((err && err.message) ? _t("Unable to verify phone number.") : _t("Operation failed")),
                            });
                        } else {
                            this.setState({ verifyError: _t("Incorrect verification code") });
                        }
                    });
                } else {
                    const msisdns = [
                        ...this.props.msisdns,
                        { address, medium: ThreepidMedium.Phone },
                    ];
                    this.props.onMsisdnsChange(msisdns);
                    newPhoneNumber = "";
                    this.setState({
                        addTask: null,
                        continueDisabled: false,
                        verifying: false,
                        verifyMsisdn: "",
                        verifyError: null,
                        newPhoneNumber,
                        newPhoneNumberCode: "",
                    });
                }
            }
        }).catch((err) => {
            this.setState({ continueDisabled: false });
            if (err.errcode !== 'M_THREEPID_AUTH_FAILED') {
                logger.error("Unable to verify phone number: " + err);
                Modal.createTrackedDialog(_t("Unable to verify phone number."), '', ErrorDialog, {
                    title: _t("Unable to verify phone number."),
                    description: ((err && err.message) ? _t("Unable to verify phone number.") : _t("Operation failed")),
                });
            } else {
                this.setState({ verifyError: _t("Incorrect verification code") });
            }
        });
    };

    private onCountryChanged = (country: PhoneNumberCountryDefinition): void => {
        this.setState({ phoneCountry: country.iso2 });
    };

    public render(): JSX.Element {
        const existingPhoneElements = this.props.msisdns.map((p) => {
            return <ExistingPhoneNumber
                        msisdn={p}
                        onRemoved={this.onRemoved}
                        key={p.address}
                        shareThreepidWhenBind={this.state.shareThreepidWhenBind}
                    />;
        });

        let addVerifySection = (
            <AccessibleButton onClick={this.onAddClick} kind="primary">
                { _t("Add") }
            </AccessibleButton>
        );
        if (this.state.verifying) {
            const msisdn = this.state.verifyMsisdn;
            addVerifySection = (
                <div>
                    <div>
                        { _t("A text message has been sent to +%(msisdn)s. " +
                            "Please enter the verification code it contains.", { msisdn: msisdn }) }
                        <br />
                        { this.state.verifyError }
                    </div>
                    <form onSubmit={this.onContinueClick} autoComplete="off" noValidate={true}>
                        <Field
                            type="text"
                            label={_t("Verification code")}
                            autoComplete="off"
                            disabled={this.state.continueDisabled}
                            value={this.state.newPhoneNumberCode}
                            onChange={this.onChangeNewPhoneNumberCode}
                        />
                        <AccessibleButton
                            onClick={this.onContinueClick}
                            kind="primary"
                            disabled={this.state.continueDisabled || this.state.newPhoneNumberCode.length === 0}
                        >
                            { _t("Continue") }
                        </AccessibleButton>
                    </form>
                </div>
            );
        }

        const phoneCountry = <CountryDropdown onOptionChange={this.onCountryChanged}
            className="mx_PhoneNumbers_country"
            value={this.state.phoneCountry}
            disabled={this.state.verifying}
            isSmall={true}
            showPrefix={true}
        />;

        return (
            <div className="mx_PhoneNumbers">
                { existingPhoneElements }
                <form onSubmit={this.onAddClick} autoComplete="off" noValidate={true} className="mx_PhoneNumbers_new">
                    <div className="mx_PhoneNumbers_input">
                        <Field
                            type="text"
                            label={_t("Phone Number")}
                            autoComplete="off"
                            disabled={this.state.verifying}
                            prefixComponent={phoneCountry}
                            value={this.state.newPhoneNumber}
                            onChange={this.onChangeNewPhoneNumber}
                        />
                    </div>
                </form>
                { addVerifySection }
            </div>
        );
    }
}
