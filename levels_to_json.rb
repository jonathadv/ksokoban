#!/usr/bin/env ruby

require 'json'

level_sets_arr = []

levels_str = STDIN.read
levels = levels_str.split("\0")

levels.each do |level_str|
  level_rows_arr = level_str.split("\n")
  level_rows_arr.shift if level_rows_arr.first.size == 0
  unless level_rows_arr.first.include?('#')
    level_sets_arr << { name: level_rows_arr.first, levels: [] }
    level_rows_arr.shift
  end
  level_sets_arr.last[:levels] << level_rows_arr
end

puts level_sets_arr.to_json
