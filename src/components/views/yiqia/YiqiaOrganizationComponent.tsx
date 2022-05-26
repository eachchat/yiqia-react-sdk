import * as React from "react";
import { DepartmentModal } from "../../../models/YiqiaModels";
import YiqiaOrganizationStore from "../../../stores/YiqiaOrganizationStore";
import dispatcher from "../../../dispatcher/dispatcher";
import { YiqiaOrganizationItemClickedPayload } from "../../../dispatcher/payloads/ViewYiqiaContactPayload";
import { Action } from "../../../dispatcher/actions";
import classNames from "classnames";

interface IProps {
    orgItem: DepartmentModal;
    level: number;
}

interface IState {
    orgDate: DepartmentModal[];
}

const OrganizationItem:React.FC<IProps> = ({orgItem, level}) => {
    const [expanded, setExpanded] = React.useState(false);
    const [selected, setSelected] = React.useState(false);
    const childNode = () => {
        if(!orgItem.children) return null;
        return (
            <ul>
                {
                    orgItem.children.map(item => {
                        return (
                            <OrganizationItem
                                orgItem={item}
                                level={level + 1}>
                            </OrganizationItem>
                        )
                    })
                }
            </ul>
        )
    }
    
    const orgItemClicked = () => {
        setExpanded(!expanded);
        dispatcher.dispatch<YiqiaOrganizationItemClickedPayload>({
            action: Action.YiqiaOrganizationItemClicked,
            departmentName: orgItem.id,
        })
    }

    const onItemExpand = () => {
        setExpanded(!expanded);
    }

    const collapseClasses = classNames({
        'yiqia_Organization_collapseBtn': true,
        'yiqia_Organization_collapseBtn_collapsed': !expanded,
        'yiqia_OrganizationItem_root': (level === 0),
    });

    const classes = classNames({
        'yiqia_OrganizationItem': true,
        'yiqia_OrganizationItem_selected': selected,
    });

    return(
        <div className="yiqia_OrganizationItemContainer">
            <div className={classes}>
                {
                    orgItem.children &&
                    <span className={collapseClasses} onClick={onItemExpand}/>
                }
                {
                    !orgItem.children &&
                    <span className="yiqia_Organization_collapseBtn_empty" onClick={onItemExpand}/>
                }
                <span className="yiqia_organization_name" onClick={orgItemClicked}>{ orgItem.name }</span>
            </div>
            {
                expanded &&
                childNode()
            }
        </div>
    )
}

export default class YiqiaOrganizationComponent extends React.Component<{}, IState> {
    constructor(props) {
        super(props)
        this.state = {
            orgDate: YiqiaOrganizationStore.Instance.orgDate,
        }
    }

    componentDidMount(): void {
        
    }

    render() {
        return (
            <div className="yiqia_Organizationlist">
                <ul>
                    {
                        this.state.orgDate?.map(Item => {
                            return (
                                <li>
                                    <OrganizationItem
                                        orgItem={Item}
                                        level={0}
                                    ></OrganizationItem>
                                </li>
                            )
                        })
                    }
                </ul>
            </div>
        )
    }
}