import React, { useEffect, useState } from 'react';

import { _t } from '../../../languageHandler';
import SdkConfig from '../../../SdkConfig';
import AccessibleButton from '../elements/AccessibleButton';
import Dropdown from '../elements/Dropdown';
import * as sdk from '../../../index';
import withValidation from '../elements/Validation';

const GMS_URL = SdkConfig.get()["gms_url"];

export const DomainDetector = ({
    lastDomainName,
    onDomainSelected
}) => {
    const [detectionResult, setDetectionResult] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(lastDomainName);
    const [matrixInfo, updateMatrixInfo] = useState(null);
    const [domainValidTooltip, setDomainValid] = useState(null);

    const toDetect = (key) => {
        closeInvalidAlert();
        if(key.trim().length === 0) {
            setDetectionResult([]);
            return;
        }
        try {
            fetch(GMS_URL + "/gms/v1/tenant/names", {
                method: "POST",
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    'tenantName': key
                })
            })
            .then((resp) => {
                return resp.json();
            })
            .then((data) => {
                if(data && data.results) {
                    setDetectionResult(data.results);
                    console.log("detectionResult ", detectionResult);
                }
                else {

                }
            })
            .catch((err) => {
                console.log("err ", err);
            })
        }
        catch(error) {
            
        }
    }

    const toGetDomainInfo = (domainName) => {
        try {
            fetch(GMS_URL + "/gms/v1/configuration", {
                method: "POST",
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    'tenantName': domainName
                })
            })
            .then((resp) => {
                return resp.json();
            })
            .then((data) => {
                if(data && data.obj) {
                    console.log("domain info matrix is ", data.obj.matrix);
                    const matrixInfoObj = {
                        hsUrl: data.obj.matrix.homeServer,
                        isUrl: "",
                        domainName: domainName
                    }
                    console.log("matrixInfo is ", matrixInfoObj);
                    updateMatrixInfo(matrixInfoObj);
                }
                else {

                }
            })
            .catch((err) => {
                console.log("err ", err);
            })
        }
        catch(error) {
            
        }
    }

    const showInvalidAlert = (alertContent) => {
        const details = <ul className="mx_Validation_details">
                <li className="mx_Validation_detail mx_Validation_invalid">
                    { alertContent }
                </li>
        </ul>;
        const feedback = <div className="mx_Validation_valid">
            { details }
        </div>;
        setDomainValid(feedback);
    }

    const closeInvalidAlert = () => {
        if(!domainValidTooltip) return;
        setDomainValid(null);
    }

    const domainConfirm = () => {
        if(matrixInfo) {
            onDomainSelected(matrixInfo);
        }
        else {
            showInvalidAlert(_t("Enter an organization"));
        }
    }

    const detectedDomain = detectionResult.map((domain) => {
        return <div className='mx_CountryDropdown_option' key={domain}>
            {domain}
        </div>
    })

    function onSelected(domainName) {
        console.log("domainName ", domainName);
        setSelectedDomain(domainName);
        toGetDomainInfo(domainName);
    }

    useEffect(() => {
        if(lastDomainName) setDetectionResult([lastDomainName]);
    }, []);

    const Tooltip = sdk.getComponent("elements.Tooltip");
    let domainEmptyTooltip;
    if(domainValidTooltip) {
        domainEmptyTooltip = <Tooltip
            tooltipClassName="mx_Field_tooltip"
            label={domainValidTooltip}
            alignment={Tooltip.Alignment.Right}
        />;
    }

    return (
        <form onSubmit={domainConfirm}>
            <div
                className='mx_DomainListDropdown_Label'
            >
                { _t("Organization") }
            </div>
            <div style={{
                flex:1}}>
                <Dropdown
                    id="mx_DomainListDropdown"
                    className='mx_DomainListDropdown_option mx_DomainListDropdown'
                    label={ _t("Organization") }
                    onOptionChange={onSelected}
                    onSearchChange={toDetect}
                    value={selectedDomain}
                    searchEnabled={true}
                    hideDropdownArrow={true}
                    onFocus={closeInvalidAlert}
                >
                    { detectedDomain }
                </Dropdown>
                { domainEmptyTooltip }
            </div>
            <AccessibleButton
                className='mx_Login_domain_confirm'
                onClick={domainConfirm}
            >
                { _t("Next step") }
            </AccessibleButton>
        </form>
    )
}