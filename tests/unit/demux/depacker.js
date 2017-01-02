#!/usr/bin/env node

import TSDemuxer from '../../../src/demux/tsdemuxer';
import Hls from '../../../src/hls';
import MP4Remuxer from '../../../src/remux/mp4-remuxer';
import Event from '../../../src/events';


var baseFile = 		'0000000560.ts';
var baseMP4File = 	'0000000560_';
var fragmentPart =  0;

class DummyConfig
{
	constructor()
	{
		this.forceKeyFrameOnDiscontinuity = 0;
	}
}

class DummyHls
{
	constructor()
	{

	}
	trigger( s0, s1)
	{
		var fs = require('fs');
		var fileName;
		// console.log( s0, s1 );
		if( s0 === Event.FRAG_PARSING_DATA) {
			// console.log( s0 );	
			console.log( s1.data1.length, s1.data2.length );
			if (s1.type === 'video')
			{
				var bufferdata1 = Buffer.from(s1.data1);
				var bufferdata2 = Buffer.from(s1.data2);

				fileName = '/media/live/hls_HEVC/test_data/' + baseMP4File + fragmentPart.toString() + '.mp4';
				fs.writeFileSync(fileName, bufferdata1, {encoding:'binary'});
				fragmentPart++;

				fileName = '/media/live/hls_HEVC/test_data/' + baseMP4File + fragmentPart.toString() + '.mp4';
				fs.writeFileSync(fileName, bufferdata2, {encoding:'binary'});
				// {
				// 	var wstream = fs.createWriteStream('/media/live/hls_HEVC/test_data/0002235664_3.mp4');
				// 	wstream.write(Buffer.from(s1.data1));
				// 	wstream.write(Buffer.from(s1.data2));
				// 	wstream.end();
				// }
				// fs.writeFileSync('/media/live/hls_HEVC/test_data/0002235664_3.mp4', buffer, {encoding:'binary'});

				console.log('The file was saved!');
			}
		}
		else if (s0 === Event.FRAG_PARSING_INIT_SEGMENT)
		{
			var bufferdata4 = Buffer.from(s1.tracks.video.initSegment);
			fileName = '/media/live/hls_HEVC/test_data/' + baseMP4File + fragmentPart.toString() + '.mp4';
			fs.writeFileSync(fileName, bufferdata4, {encoding:'binary'});
			fragmentPart++;
		}
		else
		{
			console.log( s0, s1 );
		}
		
	}
}


var fs = require('fs');
var testbuffer = fs.readFileSync('/media/live/hls_HEVC/test_data/' + baseFile); 
//var testbuffer = fs.readFileSync('/media/live/hls_HEVC/test_data/0002235664.ts'); 

var dummyHls = new DummyHls();
var dummyConfig = new DummyConfig();

var demuxer = new TSDemuxer(dummyHls, 1, MP4Remuxer, dummyConfig);
demuxer.push(testbuffer,'aac', 'hevc', 0 , undefined, 0, 0, 10);

