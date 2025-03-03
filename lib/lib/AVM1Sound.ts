/**
 * Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AVM1Object } from '../runtime/AVM1Object';
import { AVM1Context } from '../context';
import { warning } from '@awayfl/swf-loader';
import { wrapAVM1NativeClass } from './AVM1Utils';
import { AVM1MovieClip } from './AVM1MovieClip';
import { WaveAudio, AssetLibrary, Loader, AssetEvent,
	LoaderEvent, URLLoaderEvent, URLRequest, WaveAudioParser, IAsset } from '@awayjs/core';
import { MovieClip } from '@awayjs/scene';
import { AVM1SymbolBase } from './AVM1SymbolBase';

class SoundChannel {
	soundTransform: any;
}
export class AVM1Sound extends AVM1Object {
	static createAVM1Class(context: AVM1Context): AVM1Object {
		return wrapAVM1NativeClass(context, true, AVM1Sound,
			[],
			['attachSound', 'duration#', 'getBytesLoaded', 'getBytesTotal', 'loadSound',
				'getPan', 'setPan', 'getTransform', 'setTransform', 'getVolume', 'setVolume',
				'start', 'stop', 'onSoundComplete'],
			null, AVM1Sound.prototype.avm1Constructor);
	}

	private _target: AVM1SymbolBase<MovieClip>;
	private _sound: WaveAudio;
	private _channel: SoundChannel;
	private _linkageID: string;
	private _assetNameSpace: string;
	private _onCompleteCallback: Function;
	private _playAfterLoading: boolean;

	public avm1Constructor(target_mc) {
		this._target = this.context.resolveTarget(target_mc);
		this._sound = null;
		this._channel = null;
		this._linkageID = null;
		this._playAfterLoading = false;
		this._assetNameSpace = AVM1MovieClip.currentMCAssetNameSpace;
	}

	public alPut(p, v) {
		super.alPut(p,v);
		if (p && p.toLowerCase() == 'onsoundcomplete') {
			this.onSoundComplete(v);
		}
	}

	public alDeleteProperty(p) {
		super.alDeleteProperty(p);
		if (p && p.toLowerCase() == 'onsoundcomplete') {
			this.onSoundComplete();
		}
		return true;
	}

	public attachSound(id: string): void {
		if (typeof id !== 'string' && typeof id !== 'number')
			return;

		const symbol = AssetLibrary.getAsset(id, this._assetNameSpace);
		if (!symbol) {
			warning('AVM1Sound.attachSound no symbol found ' + id);
			return;
		}

		this._linkageID = id;
		this._sound = (<WaveAudio>symbol).clone();
		if (!this._sound) {
			warning('AVM1Sound.attachSound no WaveAudio found ' + id);
			return;
		}

		this.soundCompleteInternal = this.soundCompleteInternal.bind(this);
	}

	private soundCompleteInternal() {
		this._onCompleteCallback && this._onCompleteCallback();
	}

	public onSoundComplete(callback: any = null): void {
		const myThis = this;
		this._onCompleteCallback = null;

		if (callback) {
			this._onCompleteCallback = function() {
				callback.alCall(myThis);
			};
		}

		if (!this._sound) {
			warning('AVM1Sound.onSoundComplete called, but no WaveAudio set');
			return;
		}
	}

	public loadSound(url: string, isStreaming: boolean): void {
		if (isStreaming) {
			this._playAfterLoading = true;
			console.warn(
				'[AVM1Sound] - loadSound called with isStreaming=true, but streaming not implemented yet',
				url, isStreaming
			);
		} else {
			this._playAfterLoading = false;
		}
		const loader = new Loader();
		const onAssetCompleteDelegate = (event: AssetEvent) => this.onAssetComplete(event);
		const onLoadCompleteDelegate = (event: LoaderEvent) => this.onLoadComplete(event);
		const onLoadErrorDelegate = (event: URLLoaderEvent) => this.onLoadError(event);
		loader.addEventListener(AssetEvent.ASSET_COMPLETE, onAssetCompleteDelegate);
		loader.addEventListener(LoaderEvent.LOADER_COMPLETE, onLoadCompleteDelegate);
		loader.addEventListener(URLLoaderEvent.LOAD_ERROR, onLoadErrorDelegate);
		loader.load(new URLRequest(url), null, url, new WaveAudioParser());
	}

	private onAssetComplete(event: AssetEvent): void {
		const asset: IAsset = event.asset;
		if (asset.isAsset(WaveAudio)) {
			this._sound = <WaveAudio>asset;
			/*if(this._playedCompleteCallback){
				this._audio.onSoundComplete=this._playedCompleteCallback;
			}*/
			if (this._playAfterLoading) {
				this._sound.play(0);
			}
		}
	}

	private onLoadComplete(event: LoaderEvent): void {
		if (!this._sound) {
			console.warn('[AVM1Sound] - loadSound: Soundloading is complete, but no WaveAudio was created.');
		}
		/*if(this._loadCallback){
			this._loadCallback();
		}*/
	}

	private onLoadError(event: URLLoaderEvent): void {
		console.warn('[AVM1Sound] - loadSound: onLoadError');
		/*if(this._errorCallback){
			this._errorCallback();
		}*/
	}

	public getBytesLoaded(): number {
		console.warn('AVM1Sound.getBytesLoaded');
		return 0;
	}

	public getBytesTotal(): number {
		console.warn('AVM1Sound.getBytesTotal');
		return 1;
	}

	public getDuration(): number {
		console.warn('AVM1Sound.getDuration');
		return 0;
	}

	public getPan(): number {
		// console.warn('AVM1Sound.getPan');
		// todo 80pro var transform: ASObject =(<ASObject> this._channel && this._channel.soundTransform);
		return 0; //transform ? transform.axGetPublicProperty('pan') * 100 : 0;
	}

	public setPan(value: number): void {
		// console.warn("AVM1Sound.setPan");
		// todo 80pro
		/*
		var transform: ASObject = this._channel && this._channel.soundTransform;
		if (transform) {
			transform.axSetPublicProperty('pan', value / 100);
			this._channel.soundTransform = <SoundTransform>transform;
		}
		*/
	}

	public getTransform(): any {
		console.warn('AVM1Sound.getTransform');
		return null;
	}

	public setTransform(transformObject: any): void {
		console.warn('AVM1Sound.setTransform');
	}

	public getVolume(): number {
		if (!this._sound) {
			console.warn('AVM1Sound.getVolume called, but no WaveAudio set');
			return 100;
		}
		return this._sound.volume * 100;
	}

	public setVolume(value: number): void {
		if (!this._sound) {
			console.warn('AVM1Sound.setVolume called, but no WaveAudio set');
			return;
		}
		if (this._target && this._target.adaptee) {
			this._target.adaptee.soundVolume = value / 100;
		}
		this._sound.volume = value / 100;
	}

	public start(secondOffset?: number, loops?: number): void {
		if (!this._sound) {
			warning('AVM1Sound.start called, but no WaveAudio set');
			return;
		}

		secondOffset = isNaN(secondOffset) || secondOffset < 0 ? 0 : +secondOffset;
		loops = isNaN(loops) || loops < 1 ? 1 : Math.floor(loops);

		if (this._target && this._target.adaptee) {
			this._target.adaptee.startSound(
				this._linkageID,
				this._sound,
				loops,
				this.soundCompleteInternal
			);
		}
	}

	public stop(linkageID?: string): void {
		if (!this._sound) {
			warning('AVM1Sound.stop called, but no WaveAudio set');
			return;
		}
		if (this._target && this._target.adaptee) {
			this._target.adaptee.stopSounds(this._linkageID);
		}
	}

}
