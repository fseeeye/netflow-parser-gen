# [0.7.0](https://github.com/metachris/typescript-boilerplate/compare/v0.6.1...v0.7.0) (2021-11-23)


### Bug Fixes

* **parser:** update ProtocolParserGenerator ([e116ba2](https://github.com/metachris/typescript-boilerplate/commit/e116ba23eff91f3f148074d2ba8cc4ef99cb016d))
* **protocol:** improve BACnet protocol ([549e498](https://github.com/metachris/typescript-boilerplate/commit/549e4988783166d6e31d824b7b8bcd1bead96b39))


### Features

* adapt to parsing-rs v0.5.0 🎉 ([df8c408](https://github.com/metachris/typescript-boilerplate/commit/df8c408cfaaddaed9f2c74167c55e888b08bab9b))
* **protocol:** add DNP3 ([be71c6e](https://github.com/metachris/typescript-boilerplate/commit/be71c6e96c067dbd270c637c5e43b60c94583bea))
* **protocol:** add IEC60870-104 (with IEC60870-ASDU) ([24cd6b7](https://github.com/metachris/typescript-boilerplate/commit/24cd6b7a154a0603fa192eec3b55e8c8f5194f05))
* **protocol:** add Opcua protocol ([9806acf](https://github.com/metachris/typescript-boilerplate/commit/9806acfb44c51cb20bc151a26aea0d14e8c887c8))
* **protocol:** init BACnet protocol ([6afa9fb](https://github.com/metachris/typescript-boilerplate/commit/6afa9fb26ae80520386727361f18bed0305c3e0d))
* **protocol:** initially complete "S7comm" ([b97015f](https://github.com/metachris/typescript-boilerplate/commit/b97015f5c9e3fee3f24bb3fb18ed4c8d2cc39fdd))
* split ISO-on-TCP & add slice type ([5e6c57c](https://github.com/metachris/typescript-boilerplate/commit/5e6c57c63f5a6d43ae820f56daca8fa44fd80996))



## [0.6.1](https://github.com/metachris/typescript-boilerplate/compare/v0.6.0...v0.6.1) (2021-09-23)


### Bug Fixes

* **field:** fix Struct member vars in enum choice ([45fa6aa](https://github.com/metachris/typescript-boilerplate/commit/45fa6aac8ac6e3a73e182dc05e5235a9a21e28bc))
* **field:** fix the compatibility of arguments and parameters when they include periods ([a4fd291](https://github.com/metachris/typescript-boilerplate/commit/a4fd2917cbd01884f95419ab5e259ac4db990d1e))
* **protocol:** fix arguments and parameters in function-call and  match-block ([1c36f6c](https://github.com/metachris/typescript-boilerplate/commit/1c36f6c7bd4c038edf359b34933b1b369b177bbb))
* **protocol:** some pcaps don't include 'protocol version' in osi_pres, made a choice ([1f4582a](https://github.com/metachris/typescript-boilerplate/commit/1f4582ad238702137514ce8a660c4783c9e87384))


### Features

* **field:** add ber-tl field ([af901d7](https://github.com/metachris/typescript-boilerplate/commit/af901d7c3ec6e85c0272858c1de94a853cc4a83c))
* **protocol:** add a new choice type of field ([4aafb85](https://github.com/metachris/typescript-boilerplate/commit/4aafb859a7fdb61da265fc6f01cab258e3d90423))
* **protocol:** add bit operator of std ([07bd81a](https://github.com/metachris/typescript-boilerplate/commit/07bd81a90f2dcb679fccf3ef8274bb2e92290e67))
* **protocol:** add mms ([5af3884](https://github.com/metachris/typescript-boilerplate/commit/5af3884b15f350e2c52ff058f58f98eb9ba61165))
* **protocol:** add mms ([64b357f](https://github.com/metachris/typescript-boilerplate/commit/64b357f5b1d8b668ebcb8281cbe71cc9e7a6cac9))
* **protocol:** mms without its protocol stack ([29b710e](https://github.com/metachris/typescript-boilerplate/commit/29b710e7106bb151a6ba54034a4a64dd52001bb5))



# [0.6.0](https://github.com/metachris/typescript-boilerplate/compare/v0.5.1...v0.6.0) (2021-09-22)


### Features

* **all:** adapt to ICS Rule ([d41b447](https://github.com/metachris/typescript-boilerplate/commit/d41b447e54cf818cc27999ac071b8bfe23b9305e))



## [0.5.1](https://github.com/metachris/typescript-boilerplate/compare/v0.5.0...v0.5.1) (2021-08-18)


### Features

* **field:** add LoopField ([ab97b31](https://github.com/metachris/typescript-boilerplate/commit/ab97b31fe356d6e072aa55ebae32606f3d797a43))
* **field:** make var bind to input.len() ([782aedc](https://github.com/metachris/typescript-boilerplate/commit/782aedc0b4902ee05eb15c905fcaa00537e292d5))
* **protocols:** add fins ([6686b46](https://github.com/metachris/typescript-boilerplate/commit/6686b467a210a3a3e9cfcd6a37d7f7562d2fa75e))
* **protocols:** add fins and test.ts ([8c731e5](https://github.com/metachris/typescript-boilerplate/commit/8c731e52a07e102f49a4b8491a1856ce2cda190c))
* adapt to new packet struct ([f55c88c](https://github.com/metachris/typescript-boilerplate/commit/f55c88cdd6996f99ebc13815320da777a65a4c8d))
* **vec&nom:** add "bitNumVec" and handle unused nom import ([0329cf2](https://github.com/metachris/typescript-boilerplate/commit/0329cf22fe44bc16b7f03fd4a0f876ec6ac770ba))



# [0.5.0](https://github.com/metachris/typescript-boilerplate/compare/abb9e6efc0f26634cf44ac7d76323b080ca548b7...v0.5.0) (2021-07-09)


### Features

* **all:** adapt to packet trait ([dce121d](https://github.com/metachris/typescript-boilerplate/commit/dce121dd217047920c2fb290b80c6f0ce12df663))


### Reverts

* Revert "minor fix" ([abb9e6e](https://github.com/metachris/typescript-boilerplate/commit/abb9e6efc0f26634cf44ac7d76323b080ca548b7))



