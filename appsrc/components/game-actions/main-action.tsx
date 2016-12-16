
import * as React from "react";
import {connect} from "../connect";
import * as classNames from "classnames";

import Icon from "../icon";
import TaskIcon, {iconForTask} from "../task-icon";

import format from "../../util/format";
import downloadProgress from "../../util/download-progress";
import colors from "../../constants/colors";

import * as actions from "../../actions";

import {IActionsInfo} from "./types";

import {IState, IDownloadItem, ICaveRecord, IGameUpdate} from "../../types";
import {IAction, dispatcher} from "../../constants/action-types";
import {ILocalizer} from "../../localizer";

const Button = require("react-md/lib/Buttons").default;

const linearGradient = (progress: number) => {
  let percent = (progress * 100).toFixed() + "%";
  let doneColor = "#414141";
  let undoneColor = "#2B2B2B";
  return `-webkit-linear-gradient(left, ${doneColor}, ${doneColor} ` +
    `${percent}, ${undoneColor} ${percent}, ${undoneColor})`;
};

interface IStatus {
  status: string;
  statusTask?: string;
  hint?: string;
}

class MainAction extends React.Component<IMainActionProps, void> {
  render () {
    const {t, cancellable, platform, platformCompatible, mayDownload,
      pressDownload, canBeBought, progress, task, action, animate, halloween} = this.props;

    let child: React.ReactElement<any> | null = null;
    let label = "";
    let icon = "";
    let buttonType = "raised";

    if (task) {
      const {status, hint, statusTask} = this.status();
      const classes = classNames("state", "normal-state", {
        ["hint--top"]: !!hint,
      });

      const realTask = statusTask || task;

      // child = <span className={classes} data-hint={hint}>
      //   <TaskIcon task={realTask} animate={animate} action={action}/>
      //   {status}
      //   {cancellable
      //   ? <span className="cancel-cross">
      //     <Icon icon="cross"/>
      //   </span>
      //   : ""}
      // </span>;

      label = status;
      icon = iconForTask(realTask, action);
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          // child = <span className="state">
          //   <Icon icon="install"/>
          //   {t("grid.item." + (pressDownload ? "review" : "install"))}
          // </span>;
          label = t("grid.item." + (pressDownload ? "review" : "install"));
          icon = "install";
        } else if (canBeBought) {
          // child = <span className="state">
          //   <Icon icon="shopping_cart"/>
          //   {t("grid.item.buy_now")}
          // </span>;
          label = t("grid.item.buy_now");
          icon = "shopping_cart";
        }
      } else {
        // return <span className="state not-platform-compatible">
        //   {t("grid.item.not_platform_compatible", {platform: format.itchPlatform(platform)})}
        // </span>;
        label = t("grid.item.not_platform_compatible", {platform: format.itchPlatform(platform)});
        buttonType = "flat";
      }
    }

    let style: React.CSSProperties = {};
    let branded = false;
    if (progress > 0) {
      style.backgroundImage = linearGradient(progress);
      style.borderColor = "#444";
      style.width = "100%";
    } else if (halloween) {
      style.backgroundColor = colors.spooky;
      style.borderColor = colors.spookyLight;
    }

    const hint = this.hint();

    return <Button
      style={style}
      raised={buttonType === "raised"}
      flat={buttonType === "flat"}
      primary
      onClick={(e: any) => this.onClick(e)}
      tooltipLabel={hint}
      label={label}
      iconClassName={`icon icon-${icon}`}/>;
  }

  hint () {
    const {t, task} = this.props;

    if (task === "error") {
      return t("grid.item.report_problem");
    }
  }

  onClick (e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();

    let {task, cave, game, platformCompatible, mayDownload, update} = this.props;
    const {navigate, queueGame, initiatePurchase, abortGameRequest, showGameUpdate} = this.props;

    if (task === "download" || task === "find-upload") {
      navigate("downloads");
    } else {
      if (platformCompatible) {
        if (task === "launch") {
          abortGameRequest({game});
        } else if (!task || task === "idle") {
          if (cave) {
            if (update) {
              showGameUpdate({caveId: cave.id, update});
            } else {
              queueGame({game});
            }
          } else if (mayDownload) {
            queueGame({game});
          } else {
            initiatePurchase({game});
          }
        }
      } else {
        // no click action
      }
    }
  }

  status (): IStatus {
    const {t, task, action} = this.props;

    if (task === "idle") {
      const update = this.props.update;
      if (update) {
        return {status: t("grid.item.update"), statusTask: "update"};
      }

      switch (action) {
        case "open":
          return {status: t("grid.item.open"), statusTask: "open"};
        case "launch":
        default:
          return {status: t("grid.item.launch")};
      }
    }

    if (task === "error" || task === "reporting") {
      return {status: ""};
    }

    if (task === "launch") {
      return {status: t("grid.item.running")};
    }

    let res: IStatus = {status: t("grid.item.installing")};
    if (task === "uninstall") {
      res = {status: t("grid.item.uninstalling")};
    }
    if (task === "download" || task === "find-upload") {
      const downloadItem = this.props.downloadsByGameId[this.props.game.id];
      if (downloadItem && downloadItem.eta && downloadItem.bps) {
        const {eta, bps} = downloadItem;
        res = {
          status: downloadProgress(t, {eta, bps}, this.props.downloadsPaused, {onlyBPS: true}),
          hint: downloadProgress(t, {eta, bps}, this.props.downloadsPaused, {onlyETA: true}),
        };
      } else {
        res = {status: t("grid.item.downloading")};
      }
    }
    if (task === "ask-before-install") {
      res = {status: t("grid.item.finalize_installation")};
    }
    if (task === "download-queued") {
      res = {status: t("grid.item.queued")};
    }

    return res;
  }
}

interface IMainActionProps extends IActionsInfo {
  /** whether or not to animate the main action's icon (to indicate something's going on) */
  animate: boolean;
  platform: string;
  platformCompatible: boolean;
  progress: number;
  cancellable: boolean;

  pressDownload: boolean;
  halloween: boolean;
  downloadsByGameId: {
    [gameId: string]: IDownloadItem;
  };
  downloadsPaused: boolean;

  cave: ICaveRecord;
  update: IGameUpdate;

  t: ILocalizer;

  queueGame: typeof actions.queueGame;
  showGameUpdate: typeof actions.showGameUpdate;
  initiatePurchase: typeof actions.initiatePurchase;
  abortGameRequest: typeof actions.abortGameRequest;
  navigate: typeof actions.navigate;
}

const mapStateToProps = (state: IState) => ({
  halloween: state.status.bonuses.halloween,
  downloadsByGameId: state.downloads.downloadsByGameId,
  downloadsPaused: state.downloads.downloadsPaused,
});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  queueGame: dispatcher(dispatch, actions.queueGame),
  showGameUpdate: dispatcher(dispatch, actions.showGameUpdate),
  initiatePurchase: dispatcher(dispatch, actions.initiatePurchase),
  abortGameRequest: dispatcher(dispatch, actions.abortGameRequest),
  navigate: dispatcher(dispatch, actions.navigate),
});

export default connect(mapStateToProps, mapDispatchToProps)(MainAction);
