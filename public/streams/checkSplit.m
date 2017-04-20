%% load data
mainFileName = 'virtual-barber-shop';
folderInfo = dir([mainFileName '/*.mp3']);

clear output;
for i = 1:length(folderInfo);
    % load chunk
    filename = [ mainFileName '/' folderInfo(i).name ];
    [data, Fs] = audioread(filename);
    fprintf('loading %s\n', filename);
    % append chunk to output
    if (~exist('output', 'var')); output = data;
    else output = [output; data];
    end
end

[input, FsOrig] = audioread([ mainFileName '.wav' ]);

% check concatenated output length
if( length(input) ~= length(output) );
   warning('input / output length do not match');
end
trim = min(length(input), length(output));

% check sampling frequencies
if( Fs ~= FsOrig );
   warning('input / output Fs do not match');
end

%% plot / playback
o = 0.4;
plot(output(1:trim,1));
hold on
plot(input(1:trim,1) + o);
plot(output(1:trim,1) - input(1:trim,1) + 2*o);
hold off
legend({'orig', 'conv', 'diff'});

% p = audioplayer(output, Fs);
% play(p);

%% save
filename = [ mainFileName '-concat.wav' ];
fprintf('writing %s\n', filename);
audiowrite([ mainFileName '-concat.wav' ], output, Fs);