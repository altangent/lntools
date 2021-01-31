import { BufferWriter } from "@node-lightning/bufio";
import { hash256, sign, sigToDER } from "@node-lightning/crypto";
import { OutPoint } from "./OutPoint";
import { Script } from "./Script";
import { Sorter } from "./Sorter";
import { Tx } from "./Tx";
import { TxIn } from "./TxIn";
import { TxInSequence } from "./TxInSequence";
import { TxLockTime } from "./TxLockTime";
import { TxOut } from "./TxOut";
import { Value } from "./Value";
import { Witness } from "./Witness";

export class TxBuilder {
    public inputSorter: Sorter<TxIn>;
    public outputSorter: Sorter<TxOut>;

    private _version: number;
    private _locktime: TxLockTime;
    private _inputs: TxIn[];
    private _outputs: TxOut[];

    constructor(inputSorter: Sorter<TxIn> = () => 0, outputSorter: Sorter<TxOut> = () => 0) {
        this._inputs = [];
        this._outputs = [];
        this._version = 1;
        this._locktime = new TxLockTime();
        this.inputSorter = inputSorter;
        this.outputSorter = outputSorter;
    }

    /**
     * Gets or sets the transaction version. Valid transaction versions
     * are > 1.
     */
    public get version(): number {
        return this._version;
    }

    public set version(val: number) {
        this._version = val;
    }

    /**
     * Gets or sets the absolute locktime for the transaction
     */
    public get locktime(): TxLockTime {
        return this._locktime;
    }

    public set locktime(val: TxLockTime) {
        this._locktime = val;
    }

    /**
     * Gets the inputs sorted by the input sorter
     */
    public get inputs(): TxIn[] {
        const inputs = this._inputs.slice();
        inputs.sort(this.inputSorter);
        return inputs;
    }

    /**
     * Gets the outputs sorted by the output sorter
     */
    public get outputs(): TxOut[] {
        const outputs = this._outputs.slice();
        outputs.sort(this.outputSorter);
        return outputs;
    }

    /**
     * Adds a new transaction input
     * @param input
     */
    public addInput(outpoint: OutPoint, sequence?: TxInSequence, scriptSig?: Script) {
        this._inputs.push(new TxIn(outpoint, scriptSig, sequence));
    }

    /**
     * Sets the witness data for an input
     * @param index
     * @param witness
     */
    public setWitness(index: number, witness: Witness[]) {
        this.inputs[index].witness = witness;
    }

    /**
     * Adds a transaction output
     * @param output
     */
    public addOutput(value: Value, scriptPubKey: Script) {
        this._outputs.push(new TxOut(value, scriptPubKey));
    }

    /**
     * Creates a signature hash including all inputs and all outputs,
     * which is referred to as SIGHASH_ALL. The scriptSig of all inputs
     * is removed (as it is never signed), however we commit to the
     * signatory input using the scriptPubKey from the prevOut or the
     * redeemScript. The hash is constructed as the serialization of
     * all information (with the input scriptSig replaced as just
     * described) and then appending a 4-byte LE sighash type. We then
     * take the hash256 of that serialized transaction.
     *
     * @param input signatory input index
     * @param commitScript the scriptSig used for the signature input
     */
    public hashAll(input: number, commitScript: Script): Buffer {
        const writer = new BufferWriter();

        // write the version
        writer.writeUInt32LE(this.version);

        // sign all inputs as sorted by the sorting function
        const inputs = this.inputs;
        writer.writeVarInt(inputs.length);
        for (let i = 0; i < inputs.length; i++) {
            // blank out scriptSig for non-signatory inputs
            let scriptSig = new Script();

            // use the commit script for signatory input
            if (i === input) {
                scriptSig = commitScript;
            }

            // write the input
            const vin = new TxIn(inputs[i].outpoint, commitScript, inputs[i].sequence);
            writer.writeBytes(vin.serialize());
        }

        // sign all outputs as sorted by the sorting function
        const outputs = this.outputs;
        writer.writeVarInt(outputs.length);
        for (const vout of outputs) {
            writer.writeBytes(vout.serialize());
        }

        // write the sequence
        writer.writeBytes(this.locktime.serialize());

        // write the sighash type 0x01 as 4-bytes little endian
        writer.writeUInt32LE(1);

        // return hashed value
        return hash256(writer.toBuffer());
    }

    /**
     * Signs an input and returns the DER encoded signature. The
     * script that is committed to will depend on the type of the
     * signature. This is usually the locking script used in the prior
     * output, but in the case of p2sh transactions, this is the
     * redeem script, or the underlying script that is hashed in the
     * prior output.
     *
     * @param privateKey 32-byte private key
     * @param input index of input that should be signed
     * @param commitScript Script that is committed during signature
     */
    public sign(privateKey: Buffer, input: number, commitScript: Script): Buffer {
        // create the hash of the transaction for the input
        const hash = this.hashAll(input, commitScript);

        // sign DER encode signature
        const sig = sign(hash, privateKey);
        const der = sigToDER(sig);

        // return signature with 1-byte sighash type
        return Buffer.concat([der, Buffer.from([1])]);
    }

    /**
     * Returns an immutable transaction
     */
    public toTx(): Tx {
        return new Tx(
            this.version,
            this.inputs.map(vin => vin.clone()),
            this.outputs.map(vout => vout.clone()),
            this.locktime.clone(),
        );
    }

    public serialize(): Buffer {
        return this.toTx().serialize();
    }
}