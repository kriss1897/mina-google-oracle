"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accounts = exports.EthAddress = void 0;
const snarkyjs_1 = require("snarkyjs");
class EthAddress extends (0, snarkyjs_1.Struct)({ partOne: snarkyjs_1.Field, partTwo: snarkyjs_1.Field }) {
    static fromString(address) {
        const [partOne, partTwo] = snarkyjs_1.Encoding.stringToFields(address);
        return new EthAddress({ partOne, partTwo });
    }
    toString() {
        return snarkyjs_1.Encoding.stringFromFields([this.partOne, this.partTwo]);
    }
    toFields() {
        return [this.partOne, this.partTwo];
    }
}
exports.EthAddress = EthAddress;
class Accounts extends snarkyjs_1.SmartContract {
    constructor() {
        super(...arguments);
        this.controller = (0, snarkyjs_1.State)();
        this.googleId = (0, snarkyjs_1.State)();
        this.trustedOracle = (0, snarkyjs_1.State)();
        this.owner = (0, snarkyjs_1.State)();
        this.events = {
            'attach-contract': EthAddress,
        };
    }
    deploy(args) {
        super.deploy(args);
        this.setPermissions(Object.assign(Object.assign({}, snarkyjs_1.Permissions.default()), { editState: snarkyjs_1.Permissions.proof() }));
    }
    init() {
        super.init();
        this.trustedOracle.set(snarkyjs_1.PublicKey.empty());
        this.owner.set(snarkyjs_1.PublicKey.empty());
    }
    setOwner(newOwner) {
        const owner = this.owner.get();
        this.owner.assertEquals(owner);
        // Make sure the owner property can only be set once
        owner.isEmpty().assertTrue();
        this.owner.set(newOwner);
    }
    // For simplicity, a trusted oracle can only be set once
    setTrustedOracle(newOracle, ownerSignature) {
        const owner = this.owner.get();
        this.owner.assertEquals(owner);
        ownerSignature
            .verify(owner, newOracle.toFields())
            .assertTrue('Invalid owner signature');
        const oracle = this.trustedOracle.get();
        this.trustedOracle.assertEquals(oracle);
        this.trustedOracle.assertEquals(snarkyjs_1.PublicKey.empty());
        newOracle.isEmpty().assertFalse();
        this.trustedOracle.set(newOracle);
        this.googleId.set((0, snarkyjs_1.Field)(0));
        // this.emitEvent('set-trusted-oracle', newOracle);
    }
    // Oracle must validate using google oauth flow, and then
    updateController(address, oracleSignature) {
        const currentController = this.controller.get();
        this.controller.assertEquals(currentController);
        const oracle = this.trustedOracle.get();
        this.trustedOracle.assertEquals(oracle);
        const nonce = this.account.nonce.get();
        this.account.nonce.assertEquals(nonce);
        oracleSignature
            .verify(oracle, address
            .toFields())
            .assertTrue();
        this.controller.set(address);
    }
    setController(address, ownerSignature) {
        const owner = this.owner.get();
        this.owner.assertEquals(owner);
        ownerSignature.verify(owner, address.toFields()).assertTrue();
        this.controller.set(address);
    }
    // A google id can only be set by an oracle
    setGoogleId(googleId, oracleSignature) {
        const trustedOracle = this.trustedOracle.get();
        this.trustedOracle.assertEquals(trustedOracle);
        oracleSignature
            .verify(trustedOracle, [googleId].concat(this.address.toFields()))
            .assertTrue();
        this.googleId.set(googleId);
    }
}
__decorate([
    (0, snarkyjs_1.state)(EthAddress)
], Accounts.prototype, "controller", void 0);
__decorate([
    (0, snarkyjs_1.state)(snarkyjs_1.Field)
], Accounts.prototype, "googleId", void 0);
__decorate([
    (0, snarkyjs_1.state)(snarkyjs_1.PublicKey)
], Accounts.prototype, "trustedOracle", void 0);
__decorate([
    (0, snarkyjs_1.state)(snarkyjs_1.PublicKey)
], Accounts.prototype, "owner", void 0);
__decorate([
    snarkyjs_1.method
], Accounts.prototype, "setOwner", null);
__decorate([
    snarkyjs_1.method
], Accounts.prototype, "setTrustedOracle", null);
__decorate([
    snarkyjs_1.method
], Accounts.prototype, "updateController", null);
__decorate([
    snarkyjs_1.method
], Accounts.prototype, "setController", null);
__decorate([
    snarkyjs_1.method
], Accounts.prototype, "setGoogleId", null);
exports.Accounts = Accounts;
