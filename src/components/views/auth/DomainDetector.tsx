import React, { useEffect, useRef, useState } from 'react';

import { _t } from '../../../languageHandler';
import SdkConfig from '../../../SdkConfig';
import AccessibleButton from '../elements/AccessibleButton';
import { Key } from "../../../Keyboard";
import * as sdk from '../../../index';

const GMS_URL = SdkConfig.get()["gms_url"];
let hoveredNode;

const DomainList = ({
    initValue,
    onOptionChange,
    onSearchChange,
    onFocus,
    searchedDomains,
    domainValid,
}) => {

    const [expanded, setExpanded] = useState(false);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    
    const onInputChange = (e) => {
        onSearchChange(e.currentTarget.value);
    };

    const updateScroll = (hoverItem) => {
        const scrollTop = listRef.current.scrollTop;

        let { top, bottom } = hoverItem.getBoundingClientRect();
        const { top: topContainer } = listRef.current.getBoundingClientRect();
        top = top - topContainer + scrollTop;
        bottom = bottom - topContainer + scrollTop;
    
        if (top < scrollTop) {
            listRef.current.scrollTop = top;
        } else if (bottom > listRef.current.offsetHeight) {
            listRef.current.scrollTop = bottom - listRef.current.offsetHeight;
        }
    };

    const nextOption = () => {
        if(listRef.current.childNodes.length === 0) return;
        if(hoveredNode) {
            hoveredNode.style.backgroundColor = "white";
            if(!hoveredNode.nextSibling) {
                hoveredNode = listRef.current.childNodes[0];
            }
            else {
                hoveredNode = hoveredNode.nextSibling;
            }
            hoveredNode.style.backgroundColor = "#dddddd";
        }
        else {
            hoveredNode = listRef.current.childNodes[0];
            hoveredNode.style.backgroundColor = "#dddddd";
        }

        updateScroll(hoveredNode);
    }

    const prevOption = () => {
        if(listRef.current.childNodes.length === 0) return;
        if(hoveredNode) {
            hoveredNode.style.backgroundColor = "white";
            if(!hoveredNode.previousSibling) {
                hoveredNode = listRef.current.childNodes[listRef.current.childNodes.length - 1];
            }
            else {
                hoveredNode = hoveredNode.previousSibling;
            }
            hoveredNode.style.backgroundColor = "#dddddd";
        }
        else {
            hoveredNode = listRef.current.childNodes[listRef.current.childNodes.length - 1];
            hoveredNode.style.backgroundColor = "#dddddd";
        }

        updateScroll(hoveredNode);
    }

    const onKeyDown = (e) => {
        let handled = true;
        if(onFocus) onFocus();

        // These keys don't generate keypress events and so needs to be on keyup
        switch (e.key) {
            case Key.ENTER:
                if(expanded) {
                    if(hoveredNode) {
                        onItemClicked(hoveredNode.id);
                    }
                    else {
                        onItemClicked(inputRef.current.value);
                    }
                }
                else {
                    handled = false;
                }
                break;
                // fallthrough
            case Key.ESCAPE:
                close();
                break;
            case Key.ARROW_DOWN:
                if (expanded) {
                    nextOption();
                } else {
                    setExpanded(true);
                }
                break;
            case Key.ARROW_UP:
                if (expanded) {
                    prevOption();
                } else {
                    setExpanded(true);
                }
                break;
            default:
                handled = false;
        }

        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const inputOnFocus = () => {
        if(onFocus) onFocus();
    }

    const onItemClicked = (item) => {
        onOptionChange(item);
        inputRef.current.value = item;
        setExpanded(false);
    }

    useEffect(() => {
        if(searchedDomains.length === 0) {
            hoveredNode = null;
            setExpanded(false);
        }
        else {
            setExpanded(true);
        }
    }, [searchedDomains]);

    useEffect(() => {
        if(inputRef.current) {
            if(domainValid) {
                inputRef.current.style.border = "1px solid #F34A36";
            }
            else {
                inputRef.current.style.border = "1px solid #DDDDDD";
            }
        }
    }, [domainValid]);

    useEffect(() => {
        if(inputRef.current && initValue && initValue.trim().length !== 0) {
            inputRef.current.value = initValue;
            onSearchChange(initValue);
        }
    }, []);

    return(
        <div className='mx_DomainList'>
            <input
                ref={inputRef}
                type="text"
                autoFocus={true}
                className="mx_DomainList_input"
                onChange={onInputChange}
                role="combobox"
                onKeyDown={onKeyDown}
                onFocus={inputOnFocus}
                placeholder={_t("Enter your organization.")}
            />
            {
                expanded &&
                <div className='mx_Domain_candidates' ref={listRef}>
                    {
                        searchedDomains.map(item => {
                            return (
                                <div className='mx_Domain_candidate'
                                    id={item}
                                    key={item}
                                    onClick={() => {onItemClicked(item)}}
                                >
                                    {item}
                                </div>
                            )
                        })
                    }
                </div>
            }
        </div>
    )
}

export const DomainDetector = ({
    lastDomainName,
    onDomainSelected
}) => {
    const [matrixInfo, updateMatrixInfo] = useState(null);
    const [searchedDomains, setSearchedDomains] = useState([]);
    const [domainValidTooltip, setDomainValid] = useState(null);
    const [curInputValud, setCurInputValud] = useState("");

    const toDetect = (key) => {
        setCurInputValud(key.trim());
        if(key.trim().length === 0) {
            setSearchedDomains([]);
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
                if(data && data.results && data.results.length !== 0) {
                    setSearchedDomains(data.results);
                    console.log("detectionResult ", searchedDomains);
                }
                else {
                    setSearchedDomains([]);
                }
            })
            .catch((err) => {
                setSearchedDomains([]);
                console.log("err ", err);
            })
        }
        catch(error) {
            setSearchedDomains([]);
        }
    }
    
    const toGetDomainInfo = (domainName) => {
        return new Promise((resolve, reject) => {
            if(!domainName || (domainName && domainName.length === 0)) {
                showInvalidAlert(_t("Enter an organization"));
                reject();
            }
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
                    return new Promise((resolve) => {
                        resolve(resp.json());
                    });
                })
                .then((data) => {
                    if(data && data.code === 200 && data.obj && data.obj.matrix) {
                        console.log("domain info matrix is ", data.obj.matrix);
                        const matrixInfoObj = {
                            hsUrl: data.obj.matrix.homeServer,
                            isUrl: "",
                            domainName: domainName
                        }
                        console.log("matrixInfo is ", matrixInfoObj);
                        updateMatrixInfo(matrixInfoObj);
                        resolve(matrixInfoObj);
                    }
                    else {
                        if(data.message) {
                            showInvalidAlert(data.message);
                        }
                        else {
                            showInvalidAlert(_t("Unexpected error resolving homeserver configuration"));
                        }
                        reject();
                    }
                })
                .catch((err) => {
                    showInvalidAlert(_t("Unexpected error resolving homeserver configuration"));
                    console.log("err ", err);
                    reject();
                })
            }
            catch(error) {
                showInvalidAlert(_t("Unexpected error resolving homeserver configuration"));
                reject();
            }
        })
    }

    const onKeyDown = (e) => {
        switch (e.key) {
            case Key.ENTER:
                domainConfirm();
                break;
            default:
                ;
        }
    };

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

    const toDomainConfirm = () => {
        if(matrixInfo) {
            domainConfirm();
        }
        else {
            toGetDomainInfo(curInputValud)
                .then((resp) => {
                    updateMatrixInfo(resp);
                    domainConfirm(resp);
                })
                .catch((err) => {

                })
        }
    }

    const domainConfirm = (info = null) => {
        if(matrixInfo) {
            onDomainSelected(matrixInfo);
        }
        else if(info) {
            onDomainSelected(info);
        }
        else {
            if(domainValidTooltip) return;
            showInvalidAlert(_t("Enter an organization"));
        }
    }
    
    function onSelected(domainName) {
        console.log("domainName ", domainName);
        if(domainName && domainName.length === 0) {
            if(curInputValud && curInputValud.length === 0) {
                domainConfirm(null)
            }
            else {
                toGetDomainInfo(curInputValud);
            }
        }
        else {
            toGetDomainInfo(domainName);
        }
    }

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
        <form
            onKeyDown={onKeyDown}>
            <div
                className='mx_DomainListDropdown_Label'
            >
                { _t("Organization") }
            </div>
            <div style={{
                flex:1}}>
                <DomainList
                    searchedDomains={searchedDomains}
                    onSearchChange={toDetect}
                    initValue={lastDomainName}
                    onOptionChange={onSelected}
                    onFocus={closeInvalidAlert}
                    domainValid={domainValidTooltip}
                >
                </DomainList>
                { domainEmptyTooltip }
            </div>
            <AccessibleButton
                type="submit"
                className='mx_Login_domain_confirm'
                onClick={toDomainConfirm}
            >
                { _t("Next step") }
            </AccessibleButton>
        </form>
    )
}