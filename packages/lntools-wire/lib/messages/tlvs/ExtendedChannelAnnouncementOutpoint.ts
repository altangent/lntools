import { OutPoint } from "../../domain/OutPoint";
import { TlvValueReader } from "../../serialize/TlvValueReader";
import { TlvValueWriter } from "../../serialize/TlvValueWriter";
import { Tlv } from "./Tlv";

export class ExtendedChannelAnnouncementOutpoint extends Tlv {
  public static type = BigInt(16777271);

  public static deserialize(reader: TlvValueReader): ExtendedChannelAnnouncementOutpoint {
    const txid = reader.readBytes(32);
    const voutIdx = reader.readTUInt16();
    const outpoint = new OutPoint(txid.toString("hex"), voutIdx);
    const instance = new ExtendedChannelAnnouncementOutpoint();
    instance.outpoint = outpoint;
    return instance;
  }

  public type: bigint = BigInt(16777271);
  public outpoint: OutPoint;

  public serializeValue(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeBytes(Buffer.from(this.outpoint.txId, "hex"));
    writer.writeTUInt16(this.outpoint.voutIdx);
    return writer.toBuffer();
  }
}
