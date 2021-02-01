import { StreamReader } from "@node-lightning/bufio";
import * as crypto from "@node-lightning/crypto";
import { expect } from "chai";
import { OpCode } from "../lib/OpCodes";
import { Script } from "../lib/Script";
import { Fixture, testFixtures } from "./_TestHelper";

describe("Script", () => {
    describe("#parse()", () => {
        it("happy path", () => {
            const sr = StreamReader.fromHex(
                "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal(
                "304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a71601",
            );
            expect((script.cmds[1] as Buffer).toString("hex")).to.equal(
                "035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });

        it("op_code", () => {
            const sr = StreamReader.fromHex("0176");
            const script = Script.parse(sr);
            expect(script.cmds[0]).to.equal(OpCode.OP_DUP);
        });

        it("op_rawpushbytes", () => {
            const sr = StreamReader.fromHex("020100");
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00");
        });

        it("op_pushdata1", () => {
            const sr = StreamReader.fromHex("66" + "4c64" + "00".repeat(100));
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00".repeat(100));
        });

        it("op_pushdata2", () => {
            const sr = StreamReader.fromHex("fd0301" + "4d0001" + "00".repeat(256));
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00".repeat(256));
        });
    });

    describe(".equals()", () => {
        it("equal with cmds", () => {
            const script1 = new Script(OpCode.OP_3, OpCode.OP_ADD, OpCode.OP_4, OpCode.OP_EQUAL);
            const script2 = new Script(OpCode.OP_3, OpCode.OP_ADD, OpCode.OP_4, OpCode.OP_EQUAL);
            expect(script1.equals(script2)).to.equal(true);
        });

        it("equal with cmds and data", () => {
            const script1 = new Script(Buffer.from([0, 1, 2, 3]), OpCode.OP_EQUAL);
            const script2 = new Script(Buffer.from([0, 1, 2, 3]), OpCode.OP_EQUAL);
            expect(script1.equals(script2)).to.equal(true);
        });

        it("fails with length mismatch", () => {
            const script1 = new Script(OpCode.OP_4, OpCode.OP_EQUAL);
            const script2 = new Script(OpCode.OP_4);
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with OP_CODE mismatch", () => {
            const script1 = new Script(OpCode.OP_EQUAL);
            const script2 = new Script(OpCode.OP_ADD);
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with left type mismatch", () => {
            const script1 = new Script(Buffer.alloc(1, 0x01));
            const script2 = new Script(OpCode.OP_ADD);
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with right type mismatch", () => {
            const script1 = new Script(OpCode.OP_ADD);
            const script2 = new Script(Buffer.alloc(1, 0x01));
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with buffer value mismatch", () => {
            const script1 = new Script(Buffer.alloc(1, 0x01));
            const script2 = new Script(Buffer.alloc(1, 0x02));
            expect(script1.equals(script2)).to.equal(false);
        });
    });

    describe(".toString()", () => {
        it("with opcodes", () => {
            const script = new Script(
                OpCode.OP_DUP,
                OpCode.OP_HASH160,
                Buffer.from("00".repeat(20), "hex"),
                OpCode.OP_EQUALVERIFY,
                OpCode.OP_CHECKSIG,
            );
            expect(script.toString()).to.equal(
                "OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG",
            );
        });

        it("with OP_PUSHBYTES", () => {
            const script = new Script(Buffer.from("00".repeat(75), "hex"));
            expect(script.toString()).to.equal("00".repeat(75));
        });

        it("with OP_PUSHDATA1", () => {
            const script = new Script(Buffer.from("00".repeat(76), "hex"));
            expect(script.toString()).to.equal("00".repeat(76));
        });

        it("with OP_PUSHDATA2", () => {
            const script = new Script(Buffer.from("00".repeat(256), "hex"));
            expect(script.toString()).to.equal("00".repeat(256));
        });
    });

    describe(".toJSON()", () => {
        it("with opcodes", () => {
            const script = new Script(
                OpCode.OP_DUP,
                OpCode.OP_HASH160,
                Buffer.from("00".repeat(20), "hex"),
                OpCode.OP_EQUALVERIFY,
                OpCode.OP_CHECKSIG,
            );
            expect(script.toJSON()).to.equal(
                "OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG",
            );
        });

        it("with OP_PUSHBYTES", () => {
            const script = new Script(Buffer.from("00".repeat(75), "hex"));
            expect(script.toJSON()).to.equal("00".repeat(75));
        });

        it("with OP_PUSHDATA1", () => {
            const script = new Script(Buffer.from("00".repeat(76), "hex"));
            expect(script.toJSON()).to.equal("00".repeat(76));
        });

        it("with OP_PUSHDATA2", () => {
            const script = new Script(Buffer.from("00".repeat(256), "hex"));
            expect(script.toJSON()).to.equal("00".repeat(256));
        });
    });

    describe(".serialize()", () => {
        it("happy path", () => {
            const script = new Script();
            script.cmds.push(
                Buffer.from(
                    "304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a71601",
                    "hex",
                ),
            );
            script.cmds.push(
                Buffer.from(
                    "035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
                    "hex",
                ),
            );
            expect(script.serialize().toString("hex")).to.equal(
                "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });

        it("op_code", () => {
            const script = new Script(OpCode.OP_DUP);
            expect(script.serialize().toString("hex")).to.equal("0176");
        });

        it("op_rawpushbytes", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(1));
            expect(script.serialize().toString("hex")).to.equal("020100");
        });

        it("op_pushdata1", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(100));
            expect(script.serialize().toString("hex")).to.equal("66" + "4c64" + "00".repeat(100));
        });

        it("op_pushdata2", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(256));
            expect(script.serialize().toString("hex")).to.equal(
                "fd0301" + "4d0001" + "00".repeat(256),
            );
        });
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = new Script(Buffer.alloc(20, 0x01), OpCode.OP_EQUAL);
            const b = a.clone();

            // assert deep
            expect(a).to.not.equal(b);
            expect(a.cmds[0]).to.not.equal(b.cmds[0]);

            // assert values equailvalence
            expect(b.cmds[0]).to.deep.equal(b.cmds[0]);
            expect(b.cmds[1]).to.deep.equal(b.cmds[1]);
        });
    });

    describe("Factory Helpers", () => {
        // comp: 031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f
        // ucom: 041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1
        const privkeyA = Buffer.alloc(32, 1);

        // comp: 024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766
        // ucom: 044d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d07662a3eada2d0fe208b6d257ceb0f064284662e857f57b66b54c198bd310ded36d0
        const privkeyB = Buffer.alloc(32, 2);

        const invalidPubkey = Buffer.alloc(33);

        describe("#p2pkLock()", () => {
            const fixtures: Array<Fixture<Buffer, string>> = [
                {
                    title: "throws for invalid pubkey",
                    input: invalidPubkey,
                    throws: true,
                },
                {
                    title: "compressed pubkey",
                    input: crypto.getPublicKey(privkeyA, true),
                    expected:
                        "21031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078fac",
                },
                {
                    title: "uncompressed pubkey",
                    input: crypto.getPublicKey(privkeyA, false),
                    expected:
                        "41041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1ac",
                },
            ];

            const run = (input: Buffer) => Script.p2pkLock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2pkUnlock()", () => {
            const aSignHello = Buffer.from(
                "304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc",
                "hex",
            );

            const fixtures: Array<Fixture<Buffer, string>> = [
                {
                    title: "throws for invalid signature",
                    input: Buffer.alloc(32, 1),
                    throws: true,
                },
                {
                    title: "throws for missing sighash byte",
                    input: aSignHello,
                    throws: true,
                },
                {
                    title: "throws for invalid sighash byte",
                    input: Buffer.concat([aSignHello, Buffer.alloc(1, 20)]),
                    throws: true,
                },
                {
                    title: "correct key",
                    input: Buffer.concat([aSignHello, Buffer.alloc(1, 1)]),
                    expected:
                        "47304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc01",
                },
            ];

            const run = (input: Buffer) => Script.p2pkUnlock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });
    });
});

describe("Script.p2msLock", () => {
    const fixtures: any = [
        {
            assert: "2 of 2 multisig",
            input: {
                m: 2,
                pubkeys: [
                    Buffer.from(
                        "02e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f",
                        "hex",
                    ),
                    Buffer.from(
                        "02c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf18387",
                        "hex",
                    ),
                ],
            },
            expected:
                "522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752ae",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const { m, pubkeys } = input;
            const actual = Script.p2msLock(m, ...pubkeys);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2msUnlock", () => {
    const fixtures: any = [
        {
            assert: "2 of 2 multisig",
            input: {
                sigs: [Buffer.alloc(74, 0x01), Buffer.alloc(74, 0x02)],
            },
            expected:
                "004a01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101014a0202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const { sigs } = input;
            const actual = Script.p2msUnlock(...sigs);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2pkhLock", () => {
    const fixtures = [
        {
            assert: "standard script",
            input: Buffer.from("c34015187941b20ecda9378bb3cade86e80d2bfe", "hex"),
            expected: "76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2pkhLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2shLock", () => {
    const fixtures = [
        {
            assert: "non-standard script",
            input: crypto.hash160(
                new Script(
                    OpCode.OP_SHA256,
                    Buffer.from(
                        "253c853e2915f5979e3c6b248b028cc5e3b4e7be3d0884db6c3632fd85702def",
                        "hex",
                    ),
                    OpCode.OP_EQUAL,
                ).serializeCmds(),
            ),
            expected: "a9140714c97d999d7e3f1c68b015fec735b857e9064987",
        },
        {
            assert: "p2sh(p2ms) script",
            input: crypto.hash160(
                Buffer.from(
                    "522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752ae",
                    "hex",
                ),
            ),
            expected: "a91451a92be9c57d4b865e69daad982c5ab6c1d7bea187",
        },
        {
            assert: "p2sh(p2pkh) script",
            input: crypto.hash160(
                Buffer.from("76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac", "hex"),
            ),
            expected: "a91421478d4f1adfe18d59ccb5ca0e135fa6a5f3467687",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2shLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2wpkhLock", () => {
    const fixtures = [
        {
            assert: "standard script",
            input: Buffer.from("c34015187941b20ecda9378bb3cade86e80d2bfe", "hex"),
            expected: "0014c34015187941b20ecda9378bb3cade86e80d2bfe",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2wpkhLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2wshLock", () => {
    const fixtures = [
        {
            assert: "standard script",
            input: Buffer.from(
                "0000000000000000000000000000000000000000000000000000000000000000",
                "hex",
            ),
            expected: "00200000000000000000000000000000000000000000000000000000000000000000",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2wpkhLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});
