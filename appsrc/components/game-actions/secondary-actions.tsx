
import * as React from "react";
import * as classNames from "classnames";

import {connect} from "../connect";
import Icon from "../icon";

import listSecondaryActions, {IActionOpts} from "./list-secondary-actions";
import {map} from "underscore";

import {ILocalizer} from "../../localizer";
import {IAction} from "../../constants/action-types";
import {IActionsInfo} from "./types";

const Button = require("react-md/lib/Buttons").default;

class SecondaryActions extends React.Component<ISecondaryActionsProps, void> {
  render () {
    const {items, error} = listSecondaryActions(this.props);

    return <div className={classNames("cave-actions", {error})}>
      {map(items, this.action.bind(this))}
    </div>;
  }

  action (opts: IActionOpts) {
    const {t, dispatch} = this.props;
    const {action, label, icon, type = "action", classes = []} = opts;

    if (type === "info" || type === "separator" || type === "secondary") {
      return;
    }

    const key = "" + label;

    const actionClasses = classNames("secondary-action", "hint--top", classes);
    // return <span key={key} className={actionClasses} onClick={() => dispatch(action)} data-hint={t.format(label)}>
    //   <Icon icon={icon}/>
    // </span>;

    return <Button
      icon
      onClick={() => dispatch(action)}
      tooltipLabel={t.format(label)}
      iconClassName={`icon icon-${icon}`}
    />;
  }
}

interface ISecondaryActionsProps extends IActionsInfo {
  t: ILocalizer;
  dispatch: (action: IAction<any>) => void;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({dispatch});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SecondaryActions);
