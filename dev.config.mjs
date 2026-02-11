/** @type {import("@next-core/brick-container").DevConfig} */
export default {
  brickFolders: [
    // 默认使用 `node_modules/@next-bricks` 及 `node_modules/@bricks` 作为构件包文件夹。
    "node_modules/@next-bricks",
    "node_modules/@bricks",

    // 本仓库的 bricks 目录
    "bricks",

    // 引用其他仓库的构件包。注：可使用通配符，详见 https://github.com/isaacs/node-glob
    // "../other-bricks-repo/bricks",
  ],

  /** 服务端设置（特性开关和杂项配置等） */
  // settings: {
  //   featureFlags: {
  //     "my-flag": true,
  //   },
  //   misc: {
  //     "myMisc": "anything",
  //   },
  // },

  /** 微应用配置 */
  // userConfigByApps: {
  //   "my-app-id": {
  //     myAnyAppConfig: "anything",
  //   },
  // },

  /** API mocks */
  // mocks: [
  //   (req, res, next) => {
  //     switch (`${req.method} ${req.path}`) {
  //       case "GET /api/xxx":
  //         res.send("fake response");
  //         return;
  //     }
  //     next();
  //   },
  // ],
};
