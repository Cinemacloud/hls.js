/**
 * Parser for HEVC SPS NAL
*/

class HEVCSpsParser {
  constructor(data) {
    this.data = data;
    // the number of bytes left to examine in this.data
    this.bytesAvailable = this.data.byteLength;
    // the number of bits left to examine in the current word
    this.bitsAvailable = 0; // :uint
    this.firstByte = 0xff;
    this.cache = 0xff;
    this.bitsInCache = 0;
  }

  getByte() {
      var position = this.data.byteLength - this.bytesAvailable,
          availableBytes = Math.min(1, this.bytesAvailable);

      var byte = new Uint8Array(1);
      byte.set(this.data.subarray(position, position + availableBytes));
      this.bitsAvailable = availableBytes * 8;
      this.bytesAvailable -= availableBytes;

      var byteAsUint8 = new DataView(byte.buffer).getUint8(0);
      return byteAsUint8;
  }

  // (size:int):uint
  read(nbits) {
    while(this.bitsInCache < nbits) {
      var checkThreeByte = true;
      var byte = this.getByte();

      if (checkThreeByte && byte === 0x03 && this.firstByte === 0x00 &&
       (this.cache & 0xff) ===0 ) {
        byte = this.getByte();
        checkThreeByte = false;
      }
      this.cache = (this.cache << 8) | this.firstByte;
      this.firstByte = byte;
      this.bitsInCache += 8;
    }
  }


  // (size:int):void
  skipBits(nbits) {
    this.read(nbits);
    this.bitsInCache = this.bitsInCache - nbits;
  }

  // (size:int):uint
  readBits(nbits) {
    this.read(nbits);
    var shift = this.bitsInCache - nbits;
    var val = this.firstByte >> shift;
    val |= (this.cache << ( 8 - shift )); 

    val &= ((1 << nbits) - 1);
    this.bitsInCache = shift;
    return val;
  }

  // ():uint
  readUE() {
    var val = 0x00;
    var i = 0;
    var bit;
    bit = this.readBits(1);
    while (bit === 0) {
      i++;
      bit = this.readBits(1);
    }

    val = this.readBits(i);
    return (1 << i) - 1 + val;
  }

  // ():void
  readProfileTierLevel(maxSubLayersMinus1) {

    this.skipBits(2); // profile_space
    this.skipBits(1); // tierFlag
    this.skipBits(5); // profileIdc

    this.skipBits(16); // some 32bits
    this.skipBits(16);

    this.skipBits(1); // progressiveSourceFlag
    this.skipBits(1); // interlacedSourceFlag
    this.skipBits(1); // nonPackedConstraintFlag
    this.skipBits(1); // frameOnlyConstraintFlag


    this.skipBits(16); // reserved zero bits
    this.skipBits(16);
    this.skipBits(12);

    this.skipBits(8); // level_idc

    var subLayerProfilePresentFlag = [];
    var subLayerLevelPresentFlag = [];
    for (var j = 0; j < maxSubLayersMinus1; j++) {
      subLayerProfilePresentFlag[j] = this.readBits(1);
      subLayerLevelPresentFlag[j] = this.readBits(1);
    }

    if (maxSubLayersMinus1 !== 0) {
      this.skipBits( (8 - maxSubLayersMinus1) * 2 );
    }

    for (var i = 0; i < maxSubLayersMinus1; i++) {
      if(subLayerProfilePresentFlag[i] !== 0){
        this.skipBits(2);
        this.skipBits(1);
        this.skipBits(5);

        this.skipBits(16);
        this.skipBits(16);

        this.skipBits(4);

        this.skipBits(16);
        this.skipBits(16);
        this.skipBits(12);
      }
      if(subLayerLevelPresentFlag[i] !== 0){
        this.skipBits(8);
      }
    }
  }

  /**
   * Read a sequence parameter set and return some interesting video
   * properties. A sequence parameter set is the HEVC metadata that
   * describes the properties of upcoming video frames.
   * @param data {Uint8Array} the bytes of a sequence parameter set
   * @return {object} an object with configuration parsed from the
   * sequence parameter set, including the dimensions of the
   * associated video frames.
   */
  readSPSHEVC() {
    var
      vpsId = 0,
      maxSubLayersMinus1 = 0,
      tINf = 0,
      spsId = 0,
      chromaFormatIdc = 0,
      width = 0,
      height = 0,
      conformanceWindowFlag = 0,
      bitDepthLumaMinus8 = 0,
      bitDepthChromaMinus8 = 0;
      
      

      this.readBits(8); // NAL header
      this.readBits(8); // NAL header

      vpsId = this.readBits(4); // vps_id
      maxSubLayersMinus1 = this.readBits(3); // max_sub_layers_minus1
      tINf = this.readBits(1); // temporal_id_nesting_flag

      this.readProfileTierLevel(maxSubLayersMinus1);

      spsId = this.readUE(); // sps id
      chromaFormatIdc = this.readUE();
      if(chromaFormatIdc === 3) {
        this.skipBits(1); // separate_colour_plane_flag
      }

      width = this.readUE(); // pic_width_in_luma_samples
      height = this.readUE(); // pic_height_in_luma_samples


      conformanceWindowFlag = this.readBits(1);
      if( conformanceWindowFlag === 1) {
         this.skipUE(); // conf_win_left_offset
         this.skipUE(); // conf_win_right_offset
         this.skipUE(); // conf_win_top_offset
         this.skipUE(); // conf_win_bottom_offset
      }

      bitDepthLumaMinus8 = this.readUE(); // bit_depth_luma_minus8
      bitDepthChromaMinus8 = this.readUE(); // bit_depth_chroma_minus8

      return { width : width, height : height, 
        chromaFormatIdc : chromaFormatIdc, 
        bitDepthLumaMinus8 : bitDepthLumaMinus8, 
        bitDepthChromaMinus8 :  bitDepthChromaMinus8 };
  }
}

export default HEVCSpsParser;
