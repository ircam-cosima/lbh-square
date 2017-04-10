% top left / top right / bottom left / bottom right GPS coordinates
% of Stravinsky place
tl = [48.859928, 2.351483];
tr = [48.859784, 2.351896];
bl = [48.859244, 2.350892];
br = [48.859063, 2.351415];

% check coords
coords = [tl; tr; bl; br];
plot(coords(:,1), coords(:,2), 'o');

% add labels
labels = {'tl', 'tr', 'bl', 'br'};
offset = 1e-6;
for i = 1:length(coords);
    text((1+offset)*coords(i,1), (1+offset)*coords(i,2), labels{i});
end

%% create zones
zones = coords;
zones = [zones; bl + (tl-bl) / 3];
zones = [zones; bl + 2*(tl-bl) / 3];
zones = [zones; br + (tr-br) / 3];
zones = [zones; br + 2*(tr-br) / 3];

% check zones
hold on
plot(zones(:,1), zones(:,2), '*r');
hold off

% export zones
fprintf('zones: \n');
for i = 1:length(zones);
    fprintf('[ %f, %f ], \n', zones(i,1), zones(i,2));
end

%% Define zones gains

% define gain function 
x_spread = 2e-8;
y_spread = x_spread;
gainFun = @(x,y) min(1, 2*exp(-x.^2/x_spread).*exp(-y.^2/y_spread));

% define grid
step = 1e-5;
x_vect = min(zones(:,1)):step:max(zones(:,1));
y_vect = min(zones(:,2)):step:max(zones(:,2));
x_mat = repmat(x_vect, length(y_vect), 1);
y_mat = repmat(y_vect, length(x_vect), 1).';

% plot unique zone 
zoneId = 7;
g_mat = gainFun(x_mat - zones(zoneId,1), y_mat - zones(zoneId,2));
subplot(121), surf(x_mat, y_mat, g_mat);
for i = 1:length(zones);
    text(zones(i,1), zones(i,2), max(max(g_mat)), sprintf('%ld',i), 'FontSize', 18 );
end
view(0,90); colorbar

% plot all zones
g_mat = zeros(size(x_mat));
for zoneId = 1:length(zones);
    g_mat = g_mat + gainFun(x_mat - zones(zoneId,1), y_mat - zones(zoneId,2));
end
subplot(122), surf(x_mat, y_mat, g_mat);
for i = 1:length(zones);
    text(zones(i,1), zones(i,2), max(max(g_mat)), sprintf('%ld',i), 'FontSize', 18 );
end
view(0,90); colorbar

%% get min / max dist between zones

dist_vect = pdist(zones);
fprintf('min dist: %0.8f\n', min(dist_vect));
fprintf('max dist: %0.8f\n', max(dist_vect));
fprintf('mean dist: %0.8f\n', mean(dist_vect));

%% measured coords (Archos device)
% order regarding stravinsky:
% 7 6 5 4
% 0 1 2 3
%  IRCAM
coords = [
48.859415, 2.3517233 ;
48.859435, 2.3514633 ;
48.8594083, 2.3513683 ;
48.8592316, 2.3514516 ;
48.8601266, 2.3515016 ;
48.85993, 2.3516733 ;
48.8598716, 2.3516633
];

plot(coords(:,1), coords(:,2), 'o');

% add labels
offset = 0.1e-6;
for i = 1:length(coords);
    text((1+offset)*coords(i,1), (1+offset)*coords(i,2), sprintf('%ld',i));
end