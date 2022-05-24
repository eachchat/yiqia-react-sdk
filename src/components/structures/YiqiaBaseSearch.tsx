import classNames from "classnames";
import React, { createRef, RefObject, useState } from "react"
import { _t } from "../../languageHandler";
import AccessibleButton from "../views/elements/AccessibleButton";

interface IProps {
    onChange: (query) => {};
}

const YiqiaBaseSearch:React.FC<IProps> = (props) => {
    const elementRef = createRef();
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState(null);
    
    const inputClasses = classNames({
        'yiqia_ContactUserSearch_input': true,
        'yiqia_ContactUserSearch_inputExpanded': query || focused,
    });

    const onFocus = (ev: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        ev.target.select();
    };

    const onBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
    };

    const onChange = (ev: React.ChangeEvent<HTMLInputElement> | null) => {
        setQuery(ev?.target.value || "");

        if(debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        setDebounceTimer(setTimeout(() => {
            props.onChange(ev?.target.value || "");
        }, 150));
    };

    const clearInput = () => {
        if ((elementRef.current as HTMLInputElement)?.tagName !== "INPUT") return;
        (elementRef.current as HTMLInputElement).value = "";
        onChange(null);
    };

    const icon: JSX.Element = <div className="yiqia_ContactUserSearch_icon" />;
    const input: JSX.Element = <input
                type="text"
                ref={elementRef as RefObject<HTMLInputElement>}
                className={inputClasses}
                value={query}
                onFocus={onFocus}
                onBlur={onBlur}
                onChange={onChange}
                placeholder={_t("Search")}
                autoComplete="off"
            />

    const classes = classNames({
        'yiqia_ContactUserSearch': true,
        'yiqia_ContactUserSearch_hasQuery': query,
        'yiqia_ContactUserSearch_focused': focused,
    });

    return(
        <div className={classes} onClick={focus}>
            { icon }
            { input }
            <AccessibleButton
                tabIndex={-1}
                title={_t("Clear filter")}
                className="yiqia_ContactUserSearch_clearButton"
                onClick={clearInput}
            />
        </div>
    )
}

export default YiqiaBaseSearch;